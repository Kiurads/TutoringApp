"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchUserByEmail } from "./users.actions";
import { createNotification } from "@/app/lib/notifications";
import { reverseClassPoints } from "@/app/lib/gamification";
import Stripe from "stripe";

const EXPIRY_DAYS = 5;

export interface RefundRequestData {
	id: string;
	classId: string;
	studentId: string;
	teacherId: string;
	reason: string;
	status: string;
	adminNote: string | null;
	expiresAt: string;
	createdAt: string;
	class: {
		subject: string;
		startTime: string;
		totalPrice: string;
	};
	student: { name: string; email: string };
	teacher: { name: string; email: string };
}

async function mapRequest(r: Awaited<ReturnType<typeof prisma.refundRequest.findFirst>> & {
	class: { subject: { name: string }; startTime: Date; totalPrice: import("@prisma/client/runtime/library").Decimal };
	student: { firstName: string; lastName: string; email: string };
	teacher: { firstName: string; lastName: string; email: string };
} | null): Promise<RefundRequestData | null> {
	if (!r) return null;
	return {
		id: r.id,
		classId: r.classId,
		studentId: r.studentId,
		teacherId: r.teacherId,
		reason: r.reason,
		status: r.status,
		adminNote: r.adminNote ?? null,
		expiresAt: r.expiresAt.toISOString(),
		createdAt: r.createdAt.toISOString(),
		class: {
			subject: r.class.subject.name,
			startTime: r.class.startTime.toISOString(),
			totalPrice: r.class.totalPrice.toString(),
		},
		student: { name: `${r.student.firstName} ${r.student.lastName}`, email: r.student.email },
		teacher: { name: `${r.teacher.firstName} ${r.teacher.lastName}`, email: r.teacher.email },
	};
}

const INCLUDE = {
	class: { include: { subject: { select: { name: true } } } },
	student: { select: { firstName: true, lastName: true, email: true } },
	teacher: { select: { firstName: true, lastName: true, email: true } },
} as const;

// ── Expiry helper ─────────────────────────────────────────────────────────────

async function expireIfNeeded(requestId: string) {
	const req = await prisma.refundRequest.findUnique({ where: { id: requestId } });
	if (!req || req.status !== "pending") return;
	if (new Date() < req.expiresAt) return;

	const cls = await prisma.class.findUnique({
		where: { id: req.classId },
		include: { payments: { select: { intentId: true }, take: 1 } },
	});

	if (cls?.payments[0]) {
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
			await stripe.refunds.create({ payment_intent: cls.payments[0].intentId });
		} catch { /* already refunded or failed — mark resolved anyway */ }
	}
	// Reverses regardless of the try/catch outcome above, matching this
	// function's existing "proceed as refunded either way" tolerance.
	if (cls) await reverseClassPoints(cls);

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "expired" },
	});

	await createNotification(
		req.studentId,
		"refund_decided",
		"Refund Approved (Expired)",
		"Your no-show report was not disputed within 5 days. A refund has been issued.",
		`/main/student/classes/${req.classId}`,
	);
}

// ── Student actions ───────────────────────────────────────────────────────────

export async function createRefundRequest(classId: string, reason: string): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "student") return { error: "Unauthorised." };

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: {
			subject: true,
			teacher: { select: { firstName: true, lastName: true } },
			payments: { select: { intentId: true }, take: 1 },
			refundRequest: true,
		},
	});

	if (!cls) return { error: "Class not found." };
	if (cls.studentId !== user.id) return { error: "Unauthorised." };
	if (cls.status !== "completed") return { error: "Only completed classes can be reported." };
	if (!cls.paid) return { error: "Only paid classes can be reported." };
	if (cls.refundRequest) return { error: "A refund request already exists for this class." };
	if (!cls.teacherId) return { error: "No teacher assigned to this class." };

	if (!reason.trim()) return { error: "Please provide a reason." };

	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

	await prisma.refundRequest.create({
		data: {
			classId,
			studentId: user.id,
			teacherId: cls.teacherId,
			reason: reason.trim(),
			expiresAt,
		},
	});

	await createNotification(
		cls.teacherId,
		"refund_requested",
		"No-Show Reported",
		`A student reported you did not attend their ${cls.subject.name} session. Please review the request.`,
		`/main/teacher/refund-requests`,
	);

	revalidatePath(`/main/student/classes/${classId}`);
	return {};
}

export async function escalateToAdmin(requestId: string): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "student") return { error: "Unauthorised." };

	const req = await prisma.refundRequest.findUnique({
		where: { id: requestId },
		include: { class: { include: { subject: true } } },
	});

	if (!req) return { error: "Request not found." };
	if (req.studentId !== user.id) return { error: "Unauthorised." };
	if (req.status !== "refused") return { error: "Only refused requests can be escalated." };

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "admin_review" },
	});

	// Notify all admins
	const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
	await Promise.all(
		admins.map((a) =>
			createNotification(
				a.id,
				"refund_escalated",
				"Refund Dispute Escalated",
				`A student escalated a refund dispute for a ${req.class.subject.name} class. Admin review required.`,
				`/main/admin/refund-requests`,
			),
		),
	);

	revalidatePath(`/main/student/classes/${req.classId}`);
	return {};
}

export async function fetchRefundRequestByClassId(classId: string): Promise<RefundRequestData | null> {
	const req = await prisma.refundRequest.findUnique({
		where: { classId },
		include: INCLUDE,
	});
	if (req?.status === "pending") await expireIfNeeded(req.id);
	const fresh = req ? await prisma.refundRequest.findUnique({ where: { classId }, include: INCLUDE }) : null;
	return mapRequest(fresh as Parameters<typeof mapRequest>[0]);
}

// ── Teacher actions ───────────────────────────────────────────────────────────

export async function acceptRefundRequest(requestId: string): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "teacher") return { error: "Unauthorised." };

	const req = await prisma.refundRequest.findUnique({
		where: { id: requestId },
		include: {
			class: { include: { payments: { select: { intentId: true }, take: 1 }, subject: true } },
		},
	});

	if (!req) return { error: "Request not found." };
	if (req.teacherId !== user.id) return { error: "Unauthorised." };
	if (req.status !== "pending") return { error: "This request can no longer be actioned." };

	if (req.class.payments[0]) {
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
			await stripe.refunds.create({ payment_intent: req.class.payments[0].intentId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			return { error: `Refund failed: ${msg}` };
		}
		await reverseClassPoints(req.class);
	}

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "accepted" },
	});

	await createNotification(
		req.studentId,
		"refund_decided",
		"Refund Approved",
		`Your no-show report for the ${req.class.subject.name} session has been accepted. A refund has been issued.`,
		`/main/student/classes/${req.classId}`,
	);

	revalidatePath("/main/teacher/refund-requests");
	redirect("/main/teacher/refund-requests?toast=accepted");
}

export async function refuseRefundRequest(requestId: string): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "teacher") return { error: "Unauthorised." };

	const req = await prisma.refundRequest.findUnique({
		where: { id: requestId },
		include: { class: { include: { subject: true } } },
	});

	if (!req) return { error: "Request not found." };
	if (req.teacherId !== user.id) return { error: "Unauthorised." };
	if (req.status !== "pending") return { error: "This request can no longer be actioned." };

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "refused" },
	});

	await createNotification(
		req.studentId,
		"refund_decided",
		"Refund Request Refused",
		`Your no-show report for the ${req.class.subject.name} session was refused. You may escalate to admin if you disagree.`,
		`/main/student/classes/${req.classId}`,
	);

	revalidatePath("/main/teacher/refund-requests");
	redirect("/main/teacher/refund-requests?toast=refused");
}

export async function fetchRefundRequestsForTeacher(): Promise<RefundRequestData[]> {
	const session = await auth();
	if (!session?.user?.email) return [];

	const user = await fetchUserByEmail(session.user.email);
	if (!user) return [];

	const requests = await prisma.refundRequest.findMany({
		where: { teacherId: user.id },
		include: INCLUDE,
		orderBy: { createdAt: "desc" },
	});

	// Expire any pending ones past their deadline
	await Promise.all(
		requests.filter((r) => r.status === "pending").map((r) => expireIfNeeded(r.id)),
	);

	// Re-fetch after expiry checks
	const fresh = await prisma.refundRequest.findMany({
		where: { teacherId: user.id },
		include: INCLUDE,
		orderBy: { createdAt: "desc" },
	});

	return (await Promise.all(fresh.map((r) => mapRequest(r as Parameters<typeof mapRequest>[0])))).filter(Boolean) as RefundRequestData[];
}

export async function fetchRefundRequestByIdForTeacher(requestId: string): Promise<RefundRequestData | null> {
	const session = await auth();
	if (!session?.user?.email) return null;

	const user = await fetchUserByEmail(session.user.email);
	if (!user) return null;

	await expireIfNeeded(requestId);

	const req = await prisma.refundRequest.findUnique({
		where: { id: requestId },
		include: INCLUDE,
	});

	if (!req || req.teacherId !== user.id) return null;
	return mapRequest(req as Parameters<typeof mapRequest>[0]);
}

// ── Admin actions ─────────────────────────────────────────────────────────────

export async function fetchRefundRequestsForAdmin(): Promise<RefundRequestData[]> {
	const session = await auth();
	if (!session?.user?.email) return [];

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "admin") return [];

	const requests = await prisma.refundRequest.findMany({
		include: INCLUDE,
		orderBy: { createdAt: "desc" },
	});

	return (await Promise.all(requests.map((r) => mapRequest(r as Parameters<typeof mapRequest>[0])))).filter(Boolean) as RefundRequestData[];
}

export async function adminResolveRefundRequest(
	requestId: string,
	action: "refund" | "dismiss",
	adminNote?: string,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user || user.role !== "admin") return { error: "Unauthorised." };

	const req = await prisma.refundRequest.findUnique({
		where: { id: requestId },
		include: { class: { include: { payments: { select: { intentId: true }, take: 1 }, subject: true } } },
	});

	if (!req) return { error: "Request not found." };
	if (req.status !== "admin_review") return { error: "Only escalated requests can be resolved here." };

	if (action === "refund" && req.class.payments[0]) {
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
			await stripe.refunds.create({ payment_intent: req.class.payments[0].intentId });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			return { error: `Refund failed: ${msg}` };
		}
		await reverseClassPoints(req.class);
	}

	await prisma.refundRequest.update({
		where: { id: requestId },
		data: { status: "resolved", adminNote: adminNote?.trim() || null },
	});

	const studentMsg =
		action === "refund"
			? `Admin reviewed your no-show dispute for the ${req.class.subject.name} session and issued a refund.`
			: `Admin reviewed your no-show dispute for the ${req.class.subject.name} session and dismissed it.`;

	await createNotification(req.studentId, "refund_resolved", "Dispute Resolved", studentMsg, `/main/student/classes/${req.classId}`);
	await createNotification(req.teacherId, "refund_resolved", "Dispute Resolved", `Admin resolved a no-show dispute regarding the ${req.class.subject.name} session.`, `/main/teacher/refund-requests/${requestId}`);

	revalidatePath("/main/admin/refund-requests");
	redirect("/main/admin/refund-requests?toast=resolved");
}

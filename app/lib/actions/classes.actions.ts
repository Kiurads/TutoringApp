"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchUserByEmail } from "./users.actions";
import { decimalToHours } from "@/utils/decimal-to-time";
import {
	BookedClass,
	ClassData,
	ClassDataSimple,
} from "../types/classes.types";
import { formatUser } from "../types/user.types";
import { createNotification } from "@/app/lib/notifications";
import { awardGems, awardSparks } from "@/app/lib/gamification";
import Stripe from "stripe";

export interface ClassDataCalendar {
	id: string;
	subject: string;
	teacherName: string;
	studentName: string;
	/** ISO date string, e.g. "2026-04-07" */
	date: string;
	/** "HH:MM" in local time */
	startTime: string;
	duration: number;
	status: string;
}

export async function fetchClasses(): Promise<ClassData[]> {
	const classData = await prisma.class.findMany({
		include: {
			teacher: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
				},
			},
			student: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
				},
			},
			subject: {
				select: {
					name: true,
				},
			},
			requester: {
				select: {
					id: true,
				},
			},
		},
	});

	return classData.map((classData) => ({
		id: classData.id,
		teacher: classData.teacher ? formatUser(classData.teacher) : null,
		student: formatUser(classData.student),
		status: classData.status,
		subject: classData.subject.name,
		requesterId: classData.requester.id,
		startTime: classData.startTime.toISOString(),
		durationInHours: classData.durationInHours.toString(),
		paid: classData.paid,
		totalPrice: classData.totalPrice.toString(),
		createdAt: classData.createdAt.toISOString(),
		hasPreAuth: !!classData.preAuthIntentId,
		counterOfferTime: classData.counterOfferTime?.toISOString() ?? null,
		jitsiRoom: classData.jitsiRoom,
	}));
}

export async function fetchClassById(id: string): Promise<ClassData | null> {
	const classData = await prisma.class.findFirst({
		where: {
			id: id,
		},
		include: {
			teacher: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
					avatarOptions: true,
				},
			},
			student: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
					avatarOptions: true,
				},
			},
			subject: {
				select: {
					name: true,
				},
			},
			requester: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!classData) return null;

	return {
		id: classData.id,
		teacher: classData.teacher ? formatUser(classData.teacher) : null,
		student: formatUser(classData.student),
		status: classData.status,
		subject: classData.subject.name,
		requesterId: classData.requester.id,
		startTime: classData.startTime.toISOString(),
		durationInHours: classData.durationInHours.toString(),
		paid: classData.paid,
		totalPrice: classData.totalPrice.toString(),
		createdAt: classData.createdAt.toISOString(),
		hasPreAuth: !!classData.preAuthIntentId,
		counterOfferTime: classData.counterOfferTime?.toISOString() ?? null,
		jitsiRoom: classData.jitsiRoom,
	};
}

export async function fetchClassesByUser(
	user: User,
): Promise<ClassDataSimple[]> {
	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{ studentId: user.id }, // Classes where the user is the student
				{ teacherId: user.id }, // Classes where the user is the requester
			],
		},
		orderBy: {
			startTime: "desc", // Sort by startTime in descending order (most recent first)
		},
	});

	return classes.map((c) => ({
		id: c.id,
		status: c.status,
		startTime: c.startTime.toISOString(),
		durationInHours: c.durationInHours.toString(),
		paid: c.paid,
		totalPrice: c.totalPrice.toString(),
		createdAt: c.createdAt.toISOString(),
	}));
}

export async function fetchUpcomingClassesByUser(
	userEmail: string,
): Promise<ClassData[]> {
	const classes = await prisma.class.findMany({
		where: {
			startTime: {
				gt: new Date(),
			},
			OR: [
				{
					student: {
						email: userEmail,
					},
				},
				{
					teacher: {
						email: userEmail,
					},
				},
			],
		},
		include: {
			student: true,
			teacher: true,
			subject: true,
		},
		orderBy: {
			startTime: "desc",
		},
	});

	return classes.map((c) => ({
		id: c.id,
		teacher: c.teacher ? formatUser(c.teacher) : null,
		student: formatUser(c.student),
		status: c.status,
		subject: c.subject.name,
		requesterId: c.requesterId,
		startTime: c.startTime.toISOString(),
		durationInHours: c.durationInHours.toString(),
		paid: c.paid,
		hasPreAuth: !!c.preAuthIntentId,
		totalPrice: c.totalPrice.toString(),
		createdAt: c.createdAt.toISOString(),
		counterOfferTime: c.counterOfferTime?.toISOString() ?? null,
		jitsiRoom: c.jitsiRoom,
	}));
}

export async function fetchBookedClassesByUser(
	userEmail: string,
): Promise<BookedClass[]> {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return [];
	}

	const user = await fetchUserByEmail(session.user.email);

	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{
					student: {
						email: userEmail,
					},
				},
				{
					teacher: {
						email: userEmail,
					},
				},
			],
		},
		orderBy: {
			startTime: "desc",
		},
		select: {
			id: true,
			durationInHours: true,
			startTime: true,
			totalPrice: true,
			status: true,
			paid: true,
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			requester: {
				select: {
					id: true,
				},
			},
			teacher: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			subject: {
				select: {
					name: true,
				},
			},
		},
	});

	return classes.map((c) => ({
		id: c.id,
		durationInHours: decimalToHours(c.durationInHours.toNumber()),
		startTime: c.startTime,
		totalPrice: c.totalPrice.toString(),
		status: c.status,
		paid: c.paid,
		requestedBySelf: c.requester.id == user?.id,
		student: {
			name: c.student.firstName + " " + c.student.lastName,
		},
		teacher: c.teacher
			? { name: c.teacher.firstName + " " + c.teacher.lastName }
			: null,
		subject: {
			name: c.subject.name,
		},
	}));
}

export async function fetchClassRequestedBySelf(classId: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);
	const classRequested = await fetchClassById(classId);

	return classRequested?.requesterId == user?.id;
}

export async function fetchClassSubjectsBySelf() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);
	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{
					studentId: user?.id,
				},
				{
					teacherId: user?.id,
				},
			],
		},
		select: {
			subject: {
				select: {
					name: true,
				},
			},
		},
	});

	return classes.map((c) => ({
		subjectName: c.subject.name,
	}));
}

export async function fetchClassBySelfCalendar(): Promise<
	ClassDataCalendar[] | null
> {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return null;
	}

	const user = await fetchUserByEmail(session.user.email);

	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{
					studentId: user?.id,
				},
				{
					teacherId: user?.id,
				},
			],
		},
		select: {
			id: true,
			subject: {
				select: {
					name: true,
				},
			},
			startTime: true,
			durationInHours: true,
			status: true,
			teacher: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { startTime: "asc" },
	});

	return classes.map((c) => {
		// Format date and time in local ISO-like strings without timezone shift
		const d = c.startTime;
		const pad = (n: number) => String(n).padStart(2, "0");
		const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		const startTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

		return {
			id: c.id,
			subject: c.subject.name,
			teacherName: c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : "TBD",
			studentName: `${c.student.firstName} ${c.student.lastName}`,
			date,
			startTime,
			duration: c.durationInHours.toNumber(),
			status: c.status,
		};
	});
}

/**
 * Core cancellation logic (authorization, refund tiers, delete, notify) with
 * no redirect — reusable by both the direct per-class action below and
 * regular-classes.actions.ts's series cancellation, which cancels several
 * occurrences in a loop and can't have any of them throw a Next.js redirect
 * partway through.
 */
export async function cancelClassCore(
	classId: string,
	user: { id: string; role: string } | null | undefined,
): Promise<string | null> {
	// Fetch class + payment details before deletion
	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: {
			subject: true,
			student: true,
			teacher: true,
			payments: { select: { intentId: true }, take: 1 },
		},
	});

	if (!cls) return "Class not found.";

	const isParticipant =
		user?.role === "admin" ||
		user?.id === cls.studentId ||
		user?.id === cls.teacherId;
	if (!isParticipant) {
		return "You are not authorized to cancel this class.";
	}

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

	// Pre-auth not yet captured — just cancel the hold
	if (!cls.paid && cls.preAuthIntentId) {
		try {
			await stripe.paymentIntents.cancel(cls.preAuthIntentId);
		} catch {
			// Hold may have already expired — proceed with cancellation anyway
		}
	}

	// Already paid — time-based refund policy
	if (cls.paid && cls.payments.length > 0) {
		const hoursUntil = (cls.startTime.getTime() - Date.now()) / 3_600_000;
		try {
			if (hoursUntil > 24) {
				// Full refund
				await stripe.refunds.create({ payment_intent: cls.payments[0].intentId });
			} else if (hoursUntil > 12) {
				// 50% refund
				const halfCents = Math.round(Number(cls.totalPrice) * 100 * 0.5);
				await stripe.refunds.create({
					payment_intent: cls.payments[0].intentId,
					amount: halfCents,
				});
			}
			// ≤ 12 h before class — no refund
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			return `Refund failed: ${msg}. The class was not cancelled.`;
		}
	}

	await prisma.class.delete({ where: { id: classId } });

	const subject = cls.subject.name;
	if (user?.role === "teacher" && cls.teacherId) {
		await createNotification(
			cls.studentId,
			"class_cancelled",
			"Class Cancelled",
			cls.paid
				? `Your ${subject} class was cancelled by the teacher. A full refund has been issued.`
				: `Your ${subject} class was cancelled by the teacher.`,
			`/main/student/classes`,
		);
	} else if (user?.role === "student" && cls.teacherId) {
		const studentName = `${cls.student.firstName} ${cls.student.lastName}`;
		await createNotification(
			cls.teacherId,
			"class_cancelled",
			"Class Cancelled",
			`${studentName} cancelled their ${subject} class.`,
			`/main/teacher/classes`,
		);
	}

	return null;
}

export async function cancelClassById(classId: string): Promise<string | null> {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return null;
	}

	const user = await fetchUserByEmail(session.user.email);

	const result = await cancelClassCore(classId, user);
	if (result) return result;

	if (user?.role === "teacher") {
		revalidatePath("/main/teacher/classes");
		redirect("/main/teacher/classes?toast=cancelled");
	}

	revalidatePath("/main/student/classes");
	redirect("/main/student/classes?toast=cancelled");
}

export async function acceptClassById(classId: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return null;
	}

	const user = await fetchUserByEmail(session.user.email);

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: { subject: true, teacher: true, student: true },
	});

	if (cls) {
		const isParticipant =
			user?.role === "admin" ||
			user?.id === cls.studentId ||
			user?.id === cls.teacherId;
		if (!isParticipant || user?.id === cls.requesterId) {
			return null;
		}
	}

	// Capture pre-auth intent if present
	if (cls?.preAuthIntentId && cls.teacherId) {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
		try {
			await stripe.paymentIntents.capture(cls.preAuthIntentId);
			await prisma.payment.create({
				data: {
					amount: cls.totalPrice,
					intentId: cls.preAuthIntentId,
					classId: cls.id,
					studentId: cls.studentId,
					teacherId: cls.teacherId,
				},
			});
			await prisma.class.update({
				where: { id: classId },
				data: { status: "scheduled", paid: true },
			});
			await awardGems(cls.studentId, 50);
		} catch {
			// Capture failed — accept the class but leave it unpaid
			await prisma.class.update({
				where: { id: classId },
				data: { status: "scheduled" },
			});
		}
	} else {
		await prisma.class.update({
			where: { id: classId },
			data: { status: "scheduled" },
		});
	}

	if (cls) {
		const wasRequestedByTeacher = cls.requesterId === cls.teacherId;
		if (wasRequestedByTeacher && cls.teacherId) {
			// Teacher requested → notify teacher that student accepted
			const studentName = `${cls.student.firstName} ${cls.student.lastName}`;
			await createNotification(
				cls.teacherId,
				"class_accepted",
				"Class Accepted",
				`${studentName} accepted your ${cls.subject.name} class request.`,
				`/main/teacher/classes/${classId}`,
			);
		} else {
			// Student requested → notify student that teacher accepted
			const teacherName = cls.teacher
				? `${cls.teacher.firstName} ${cls.teacher.lastName}`
				: "Your teacher";
			await createNotification(
				cls.studentId,
				"class_accepted",
				"Class Accepted",
				`${teacherName} accepted your ${cls.subject.name} class.`,
				`/main/student/classes/${classId}`,
			);
		}

		// Award sparks to the teacher who accepted
		if (cls.teacherId) {
			await awardSparks(cls.teacherId, 50);
		}
	}

	if (user?.role === "teacher") {
		revalidatePath("/main/teacher/classes");
		redirect("/main/teacher/classes?toast=accepted");
	}

	revalidatePath("/main/student/classes");
	redirect("/main/student/classes?toast=accepted");
}

export async function refuseClassById(classId: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return null;
	}

	const user = await fetchUserByEmail(session.user.email);

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: { subject: true, teacher: true, student: true },
	});

	if (cls) {
		const isParticipant =
			user?.role === "admin" ||
			user?.id === cls.studentId ||
			user?.id === cls.teacherId;
		if (!isParticipant || user?.id === cls.requesterId) {
			return null;
		}
	}

	// Cancel pre-auth hold so the card is released immediately
	if (cls?.preAuthIntentId) {
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
		try {
			await stripe.paymentIntents.cancel(cls.preAuthIntentId);
		} catch {
			// Hold may have already expired — proceed
		}
	}

	await prisma.class.update({
		where: { id: classId },
		data: { status: "refused" },
	});

	if (cls) {
		const wasRequestedByTeacher = cls.requesterId === cls.teacherId;
		if (wasRequestedByTeacher && cls.teacherId) {
			// Teacher requested → notify teacher that student refused
			const studentName = `${cls.student.firstName} ${cls.student.lastName}`;
			await createNotification(
				cls.teacherId,
				"class_refused",
				"Class Request Declined",
				`${studentName} declined your ${cls.subject.name} class request.`,
				`/main/teacher/classes`,
			);
		} else {
			// Student requested → notify student that teacher refused
			const teacherName = cls.teacher
				? `${cls.teacher.firstName} ${cls.teacher.lastName}`
				: "The teacher";
			await createNotification(
				cls.studentId,
				"class_refused",
				"Class Request Refused",
				`${teacherName} declined your ${cls.subject.name} class request.`,
				`/main/student/classes`,
			);
		}
	}

	if (user?.role === "teacher") {
		revalidatePath("/main/teacher/classes");
		redirect("/main/teacher/classes?toast=refused");
	}

	revalidatePath("/main/student/classes");
	redirect("/main/student/classes?toast=refused");
}

export interface OpenRequest {
	id: string;
	subject: string;
	studentName: string;
	startTime: Date;
	durationInHours: string;
}

export async function fetchOpenRequestsForTeacher(
	teacherEmail: string,
): Promise<OpenRequest[]> {
	const teacher = await prisma.user.findUnique({
		where: { email: teacherEmail },
		select: {
			id: true,
			teacherSubject: { select: { subjectId: true } },
		},
	});

	if (!teacher) return [];

	const subjectIds = teacher.teacherSubject.map((ts) => ts.subjectId);

	const openRequests = await prisma.class.findMany({
		where: {
			teacherId: null,
			status: "requested",
			subjectId: { in: subjectIds },
		},
		select: {
			id: true,
			startTime: true,
			durationInHours: true,
			student: { select: { firstName: true, lastName: true } },
			subject: { select: { name: true } },
		},
		orderBy: { startTime: "asc" },
	});

	return openRequests.map((r) => ({
		id: r.id,
		subject: r.subject.name,
		studentName: `${r.student.firstName} ${r.student.lastName}`,
		startTime: r.startTime,
		durationInHours: decimalToHours(r.durationInHours.toNumber()),
	}));
}

export async function claimClass(classId: string) {
	const session = await auth();
	if (!session?.user?.email) return;

	const teacher = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, pricePerHour: true },
	});

	if (!teacher || !teacher.pricePerHour) return;

	let claimedStudentId: string | null = null;
	let claimedSubject: string | null = null;

	try {
		await prisma.$transaction(async (tx) => {
			const cls = await tx.class.findFirst({
				where: { id: classId, teacherId: null, status: "requested" },
				include: { subject: true },
			});

			if (!cls) throw new Error("Request no longer available.");

			const totalPrice =
				Number(teacher.pricePerHour) * cls.durationInHours.toNumber();

			await tx.class.update({
				where: { id: classId },
				data: { teacherId: teacher.id, status: "scheduled", totalPrice },
			});

			claimedStudentId = cls.studentId;
			claimedSubject = cls.subject.name;
		});
	} catch {
		// Race condition: another teacher already claimed it
	}

	if (claimedStudentId && claimedSubject) {
		const teacherRecord = await prisma.user.findUnique({
			where: { id: teacher.id },
			select: { firstName: true, lastName: true },
		});
		const teacherName = teacherRecord
			? `${teacherRecord.firstName} ${teacherRecord.lastName}`
			: "A teacher";
		await createNotification(
			claimedStudentId,
			"class_claimed",
			"Teacher Found!",
			`${teacherName} has claimed your ${claimedSubject} class request.`,
			`/main/student/classes/${classId}`,
		);
	}

	revalidatePath("/main/teacher/classes");
	redirect("/main/teacher/classes?toast=claimed");
}

// ── Counter-offer ─────────────────────────────────────────────────────────────

export async function proposeCounterOffer(
	classId: string,
	newTime: string, // ISO string from datetime-local input
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await fetchUserByEmail(session.user.email);
	if (!user) return { error: "User not found." };

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: { subject: true, student: true, teacher: true },
	});
	if (!cls) return { error: "Class not found." };
	if (cls.status !== "requested") return { error: "Class is no longer pending." };

	const isParticipant =
		user.role === "admin" ||
		user.id === cls.studentId ||
		user.id === cls.teacherId;
	if (!isParticipant || user.id === cls.requesterId) {
		return { error: "You are not authorized to propose a new time for this class." };
	}

	const proposedTime = new Date(newTime);
	if (isNaN(proposedTime.getTime())) return { error: "Invalid date." };

	await prisma.class.update({
		where: { id: classId },
		data: { counterOfferTime: proposedTime },
	});

	const teacherName = cls.teacher
		? `${cls.teacher.firstName} ${cls.teacher.lastName}`
		: "Your teacher";

	const formattedTime = proposedTime.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	await createNotification(
		cls.studentId,
		"counter_offer_proposed",
		"New Time Suggested",
		`${teacherName} has suggested a new time for your ${cls.subject.name} class: ${formattedTime}.`,
		`/main/student/classes/${classId}`,
	);

	revalidatePath(`/main/teacher/classes/${classId}`);
	return {};
}

export async function acceptCounterOffer(
	classId: string,
): Promise<void> {
	const session = await auth();
	if (!session?.user?.email) return;
	const user = await fetchUserByEmail(session.user.email);

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: { subject: true, teacher: true },
	});

	if (!cls?.counterOfferTime) return;
	if (user?.role !== "admin" && user?.id !== cls.requesterId) return;

	await prisma.class.update({
		where: { id: classId },
		data: { startTime: cls.counterOfferTime, counterOfferTime: null },
	});

	if (cls.teacherId) {
		const formattedTime = cls.counterOfferTime.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
		await createNotification(
			cls.teacherId,
			"counter_offer_accepted",
			"Counter-offer Accepted",
			`The student accepted your new time for the ${cls.subject.name} class: ${formattedTime}.`,
			`/main/teacher/classes/${classId}`,
		);
	}

	revalidatePath(`/main/student/classes/${classId}`);
	redirect(`/main/student/classes/${classId}?toast=time_accepted`);
}

export async function declineCounterOffer(
	classId: string,
): Promise<void> {
	const session = await auth();
	if (!session?.user?.email) return;
	const user = await fetchUserByEmail(session.user.email);

	const cls = await prisma.class.findUnique({
		where: { id: classId },
		include: { subject: true, teacher: true },
	});

	if (!cls) return;
	if (user?.role !== "admin" && user?.id !== cls.requesterId) return;

	await prisma.class.update({
		where: { id: classId },
		data: { counterOfferTime: null },
	});

	if (cls.teacherId) {
		await createNotification(
			cls.teacherId,
			"counter_offer_declined",
			"Counter-offer Declined",
			`The student declined your suggested time for the ${cls.subject.name} class.`,
			`/main/teacher/classes/${classId}`,
		);
	}

	revalidatePath(`/main/student/classes/${classId}`);
	redirect(`/main/student/classes/${classId}?toast=time_declined`);
}

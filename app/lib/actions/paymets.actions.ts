"use server";

import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { awardGems } from "@/app/lib/gamification";
import { computeCommissionSplit } from "@/app/lib/payouts-utils";

export async function fetchPaymentsByUserId(email: string) {
	// Get student ID from email
	const student = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (!student) return [];

	// Fetch payments
	const payments = await prisma.payment.findMany({
		where: {
			studentId: student.id,
		},
		select: {
			id: true,
			amount: true,
			teacher: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			createdAt: true,
		},
	});

	// Return formatted payments
	return payments.map((p) => ({
		id: p.id,
		amount: p.amount.toNumber(),
		teacherName: `${p.teacher.firstName} ${p.teacher.lastName}`,
		date: p.createdAt,
	}));
}

export async function fetchPaymentsByTeacherId(email: string) {
	// Get teacher ID from email
	const teacher = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (!teacher) return [];

	// Fetch payments
	const payments = await prisma.payment.findMany({
		where: {
			teacherId: teacher.id,
		},
		select: {
			id: true,
			amount: true,
			teacherPayoutAmount: true,
			platformFeeAmount: true,
			payoutStatus: true,
			payoutError: true,
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			createdAt: true,
		},
	});

	// Return formatted payments
	return payments.map((p) => ({
		id: p.id,
		amount: p.amount,
		// Nullable only for the handful of rows that could somehow predate the
		// migration backfill — falls back to the gross amount so the UI never
		// shows a blank/zero payout for those. Converted to plain numbers
		// (unlike `amount`, kept as Decimal above for backwards compatibility)
		// so callers never have to juggle a Decimal-or-number union.
		teacherPayoutAmount: (p.teacherPayoutAmount ?? p.amount).toNumber(),
		platformFeeAmount: p.platformFeeAmount ? p.platformFeeAmount.toNumber() : 0,
		payoutStatus: p.payoutStatus,
		payoutError: p.payoutError,
		studentName: `${p.student.firstName} ${p.student.lastName}`,
		date: p.createdAt,
	}));
}

export interface PaymentReceipt {
	id: string;
	amount: number;
	platformFeeAmount: number;
	teacherPayoutAmount: number;
	createdAt: Date;
	intentId: string;
	student: { name: string; email: string };
	teacher: { name: string; email: string };
	subjectName: string;
	classStartTime: Date;
	durationInHours: number;
}

/**
 * Fetches everything needed to render a receipt for a single payment, scoped
 * to whichever side of the transaction is asking — a student can only pull
 * up their own receipts, a teacher only theirs. Returns null on a missing
 * payment or a mismatched viewer rather than throwing, since both cases
 * should render as "not found" to the caller.
 */
export async function fetchPaymentReceipt(
	paymentId: string,
	viewerEmail: string,
): Promise<PaymentReceipt | null> {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
		select: {
			id: true,
			amount: true,
			platformFeeAmount: true,
			teacherPayoutAmount: true,
			createdAt: true,
			intentId: true,
			student: { select: { firstName: true, lastName: true, email: true } },
			teacher: { select: { firstName: true, lastName: true, email: true } },
			class: {
				select: {
					startTime: true,
					durationInHours: true,
					subject: { select: { name: true } },
				},
			},
		},
	});

	if (!payment) return null;
	if (payment.student.email !== viewerEmail && payment.teacher.email !== viewerEmail) {
		return null;
	}

	return {
		id: payment.id,
		amount: payment.amount.toNumber(),
		platformFeeAmount: payment.platformFeeAmount?.toNumber() ?? 0,
		teacherPayoutAmount: (payment.teacherPayoutAmount ?? payment.amount).toNumber(),
		createdAt: payment.createdAt,
		intentId: payment.intentId,
		student: {
			name: `${payment.student.firstName} ${payment.student.lastName}`,
			email: payment.student.email,
		},
		teacher: {
			name: `${payment.teacher.firstName} ${payment.teacher.lastName}`,
			email: payment.teacher.email,
		},
		subjectName: payment.class.subject.name,
		classStartTime: payment.class.startTime,
		durationInHours: payment.class.durationInHours.toNumber(),
	};
}

export async function createPaymentForClass(
	classId: string,
	paymentIntentId: string
) {
	const classData = await prisma.class.findFirst({
		where: {
			id: classId,
		},
		include: {
			student: true,
			teacher: true,
			subject: true,
		},
	});

	if (!classData || !classData.teacherId) {
		return null;
	}

	const split = computeCommissionSplit(Number(classData.totalPrice));

	await prisma.payment.create({
		data: {
			amount: classData.totalPrice,
			intentId: paymentIntentId,
			classId: classData.id,
			studentId: classData.studentId,
			teacherId: classData.teacherId,
			platformFeeAmount: split.platformFeeAmount,
			teacherPayoutAmount: split.teacherPayoutAmount,
			platformFeeRateBps: split.platformFeeRateBps,
		},
	});

	await prisma.class.update({
		where: { id: classId },
		data: { paid: true },
	});

	// Notify teacher of payment
	await createNotification(
		classData.teacherId,
		"class_paid",
		"Payment Received",
		`${classData.student.firstName} ${classData.student.lastName} paid ${Number(classData.totalPrice).toFixed(2)}€ for their ${classData.subject.name} class.`,
		`/main/teacher/earnings`,
	);

	// Award gems to student for completing payment
	await awardGems(classData.studentId, 50);

	return {
		startTime: classData.startTime,
		status: classData.status,
		student: {
			name:
				classData.student.firstName + " " + classData.student.lastName,
		},
		teacher: {
			name: classData.teacher
				? classData.teacher.firstName + " " + classData.teacher.lastName
				: "Unknown",
		},
		subject: {
			name: classData.subject.name,
		},
	};
}

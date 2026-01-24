"use server";

import prisma from "@/prisma";

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
		amount: p.amount,
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
		studentName: `${p.student.firstName} ${p.student.lastName}`,
		date: p.createdAt,
	}));
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

	if (!classData) {
		return null;
	}

	await prisma.payment.create({
		data: {
			amount: classData.totalPrice,
			intentId: paymentIntentId,
			classId: classData.id,
			studentId: classData.studentId,
			teacherId: classData.teacherId,
		},
	});

	await prisma.class.update({
		where: {
			id: classId,
		},
		data: {
			paid: true,
		},
	});

	return {
		startTime: classData.startTime,
		status: classData.status,
		student: {
			name:
				classData.student.firstName + " " + classData.student.lastName,
		},
		teacher: {
			name:
				classData.teacher.firstName + " " + classData.teacher.lastName,
		},
		subject: {
			name: classData.subject.name,
		},
	};
}

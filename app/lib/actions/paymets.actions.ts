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

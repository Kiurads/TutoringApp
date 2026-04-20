"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { isWithinAvailability } from "@/app/lib/availability/check-availability";

export interface PreAuthClassData {
	subjectId: string;
	teacherId: string;
	startTime: string;
	durationInHours: number;
}

export async function createClassWithPreAuth(
	data: PreAuthClassData,
	preAuthIntentId: string,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const student = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			studentGameProfile: { select: { studyBoostActive: true } },
		},
	});
	if (!student) return { error: "Student not found." };

	const studyBoostActive = student.studentGameProfile?.studyBoostActive ?? false;

	const teacher = await prisma.user.findUnique({
		where: { id: data.teacherId },
		select: { pricePerHour: true, firstName: true, lastName: true },
	});
	if (!teacher?.pricePerHour) return { error: "Teacher or price not found." };

	const subject = await prisma.subject.findUnique({
		where: { id: data.subjectId },
		select: { name: true },
	});

	const classStartTime = new Date(data.startTime);

	// Availability double-check (defence in depth — primary check is in the pre-auth API)
	const availabilitySlots = await prisma.teacherAvailability.findMany({
		where: { teacherId: data.teacherId },
		select: { dayOfWeek: true, startHour: true, startMin: true },
	});
	if (!isWithinAvailability(availabilitySlots, classStartTime, data.durationInHours)) {
		return { error: "The teacher is not available at the selected time." };
	}

	const basePrice = Number(teacher.pricePerHour) * data.durationInHours;
	const totalPrice = studyBoostActive
		? Math.round(basePrice * 0.95 * 100) / 100
		: basePrice;

	const newClass = await prisma.class.create({
		data: {
			studentId: student.id,
			teacherId: data.teacherId,
			subjectId: data.subjectId,
			startTime: classStartTime,
			durationInHours: data.durationInHours,
			totalPrice,
			status: "requested",
			requesterId: student.id,
			preAuthIntentId,
		},
	});

	// Consume Study Boost after successful class creation
	if (studyBoostActive) {
		await prisma.studentGameProfile.update({
			where: { userId: student.id },
			data: { studyBoostActive: false },
		});
	}

	await createNotification(
		data.teacherId,
		"class_requested",
		"New Class Request",
		`${student.firstName} ${student.lastName} is requesting a ${subject?.name ?? "class"} on ${classStartTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Payment is pre-authorized.`,
		`/main/teacher/classes/${newClass.id}`,
	);

	redirect("/main/student/classes?toast=created");
}

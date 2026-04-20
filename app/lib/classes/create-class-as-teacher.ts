"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";

export async function createClassAsTeacher(
	_prevState: string | undefined,
	formData: FormData,
) {
	const session = await auth();
	if (!session || !session.user || !session.user.email) {
		return "You must be logged in to create a class.";
	}

	const subjectId = formData.get("subject") as string;
	const studentId = formData.get("student") as string;
	const startTime = formData.get("startTime") as string;
	const duration = formData.get("duration") as string;

	if (!subjectId) return "Please select a subject.";
	if (!studentId) return "Please select a student.";
	if (!startTime) return "Please select a start time.";
	if (!duration) return "Please select a duration.";

	const classStartTime = new Date(startTime);
	const tomorrow = new Date();
	tomorrow.setHours(0, 0, 0, 0);
	tomorrow.setDate(tomorrow.getDate() + 1);

	if (classStartTime < tomorrow) {
		return "Start time must be from tomorrow onward.";
	}

	const teacher = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, firstName: true, lastName: true, pricePerHour: true },
	});

	if (!teacher) return "Teacher not found.";
	if (!teacher.pricePerHour) return "You must set your hourly rate before creating classes.";

	const durationInHours = parseFloat(duration);
	const totalPrice = Number(teacher.pricePerHour) * durationInHours;

	const [subject] = await Promise.all([
		prisma.subject.findUnique({ where: { id: subjectId }, select: { name: true } }),
	]);

	const newClass = await prisma.class.create({
		data: {
			studentId,
			teacherId: teacher.id,
			subjectId,
			startTime: classStartTime,
			durationInHours,
			totalPrice,
			status: "requested",
			requesterId: teacher.id,
		},
	});

	// Notify student of the teacher's request
	const teacherName = `${teacher.firstName} ${teacher.lastName}`;
	await createNotification(
		studentId,
		"class_requested",
		"New Class Request",
		`${teacherName} has requested a ${subject?.name ?? "class"} with you on ${classStartTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
		`/main/student/classes/${newClass.id}`,
	);

	redirect("/main/teacher/classes");
}

"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import prisma from "@/prisma";

export async function createClassAsTeacher(
	_prevState: string | undefined,
	formData: FormData,
) {
	const session = await auth();
	if (!session || !session.user || !session.user.email) {
		return "You must be logged in to create a class.";
	}

	// Extract form data
	const subjectId = formData.get("subject") as string;
	const studentId = formData.get("student") as string;
	const startTime = formData.get("startTime") as string;
	const duration = formData.get("duration") as string;

	// Ensure required fields are present
	if (!subjectId) return "Please select a subject.";
	if (!studentId) return "Please select a student.";
	if (!startTime) return "Please select a start time.";
	if (!duration) return "Please select a duration.";

	// Convert startTime to a Date object
	const classStartTime = new Date(startTime);
	const tomorrow = new Date();
	tomorrow.setHours(0, 0, 0, 0);
	tomorrow.setDate(tomorrow.getDate() + 1);

	if (classStartTime < tomorrow) {
		return "Start time must be from tomorrow onward.";
	}

	// Get teacher ID from session
	const teacher = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, pricePerHour: true },
	});

	if (!teacher) {
		return "Teacher not found.";
	}

	if (!teacher.pricePerHour) {
		return "You must set your hourly rate before creating classes.";
	}

	// Calculate total price
	const durationInHours = parseFloat(duration);
	const totalPrice = Number(teacher.pricePerHour) * durationInHours;

	// Create the class in the database
	await prisma.class.create({
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

	// Redirect to the classes page after successful creation
	redirect("/main/teacher/classes");
}

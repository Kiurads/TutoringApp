"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import prisma from "@/prisma";
import resend from "@/resend";
import { EmailTemplate } from "@/email/email-template";

export async function createClassAsStudent(
	prevState: string | undefined,
	formData: FormData
) {
	const session = await auth();
	if (!session || !session.user || !session.user.email) {
		return "You must be logged in to create a class.";
	}

	// Extract form data
	const subjectId = formData.get("subject") as string;
	const teacherId = formData.get("teacher") as string;
	const startTime = formData.get("startTime") as string;
	const duration = formData.get("duration") as string;

	// Ensure required fields are present
	if (!subjectId) return "Please select a subject.";
	if (!teacherId) return "Please select a teacher.";
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

	// Get student ID from session
	const student = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true },
	});

	if (!student) {
		return "Student not found.";
	}

	// Fetch teacher's hourly rate
	const teacher = await prisma.user.findUnique({
		where: { id: teacherId },
		select: {
			pricePerHour: true,
			email: true,
		},
	});

	if (!teacher || !teacher.pricePerHour) {
		return "Teacher not found.";
	}

	// Calculate total price
	const durationInHours = parseFloat(duration);
	const totalPrice = teacher.pricePerHour * durationInHours;

	// Create the class in the database
	await prisma.class.create({
		data: {
			studentId: student.id,
			teacherId,
			subjectId,
			startTime: classStartTime,
			durationInHours,
			totalPrice,
			status: "requested",
			requesterId: student.id,
		},
	});

	const { data, error } = await resend.emails.send({
		from: "Acme <confirmation@estudyou.com>",
		to: ["gcuradosilva@gmail.com"],
		subject: "Hello world",
		react: await EmailTemplate({ firstName: "John" }),
	});

	if (error) {
		console.error("Failed to send email", error);
	}

	// Redirect to the classes page after successful creation
	redirect("/main/classes");
}

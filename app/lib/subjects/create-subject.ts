"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import prisma from "@/prisma";

export async function createSubject(
	_prevState: string | undefined,
	formData: FormData
) {
	const session = await auth();
	if (!session || !session.user || !session.user.email) {
		return "You must be logged in to create a class.";
	}

	if (!session.user.role || session.user.role !== "admin") {
		return "You do not have permission to create a subject.";
	}

	// Extract form data
	const subjectName = formData.get("name") as string;

	// Ensure required fields are present
	if (!subjectName) return "Please select a subject name.";

	// Check for duplicate subject
	const existingSubject = await prisma.subject.findUnique({
		where: { name: subjectName },
	});

	if (existingSubject) {
		return "A subject with this name already exists.";
	}

	// Create the subject
	await prisma.subject.create({
		data: { name: subjectName },
	});

	// Redirect to the classes page after successful creation
	redirect("/main/admin/subjects");
}

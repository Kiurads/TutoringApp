"use server";

import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerTeacher(
	prevState: string | undefined,
	formData: FormData
) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const phoneNumber = formData.get("phoneNumber") as string;
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const subjects = formData.getAll("subjects") as string[]; // multiple select

	if (!email) {
		return "Please enter a valid email";
	}

	if (!password) {
		return "Please enter a valid password";
	}

	if (!firstName) {
		return "Please enter a valid first name";
	}

	if (!lastName) {
		return "Please enter a valid last name";
	}

	if (phoneNumber && /^\d{9}$/.test(phoneNumber) === false) {
		return "Please enter a valid phone number";
	}

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			return "User already exists";
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		// Create teacher
		const teacher = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				phoneNumber,
				firstName,
				lastName,
				role: "teacher",
			},
		});

		// Assign subjects (if any)
		if (subjects.length > 0) {
			await prisma.teacherSubject.createMany({
				data: subjects.map((subjectId) => ({
					teacherId: teacher.id,
					subjectId,
				})),
				skipDuplicates: true,
			});
		}
	} catch (error) {
		console.error(error);
		return "Something went wrong while creating the teacher";
	}

	redirect("/login");
}

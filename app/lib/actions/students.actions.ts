"use server";

import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import UserDetails from "../types/user.types";

export async function fetchStudents(): Promise<UserDetails[]> {
	try {
		const students = await prisma.user.findMany({
			where: {
				role: "student",
			},
		});

		return students.map((student) => ({
			id: student.id,
			name: `${student.firstName} ${student.lastName}`,
			email: student.email,
			role: student.role,
		}));
	} catch (error) {
		console.log(error);
		return [];
	}
}

export async function fetchStudentsByTeacher(): Promise<UserDetails[]> {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return [];
	}

	const teacher = await fetchUserByEmail(session.user.email);

	if (!teacher) {
		return [];
	}

	try {
		// Get unique students who have classes with this teacher
		const classes = await prisma.class.findMany({
			where: {
				teacherId: teacher.id,
			},
			select: {
				student: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						role: true,
					},
				},
			},
			distinct: ["studentId"],
		});

		// Also get students from regular classes
		const regularClasses = await prisma.regularClass.findMany({
			where: {
				teacherId: teacher.id,
			},
			select: {
				student: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						role: true,
					},
				},
			},
			distinct: ["studentId"],
		});

		// Combine and deduplicate students
		const studentsMap = new Map();

		classes.forEach((c) => {
			const student = c.student;
			studentsMap.set(student.id, {
				id: student.id,
				name: `${student.firstName} ${student.lastName}`,
				email: student.email,
				role: student.role,
			});
		});

		regularClasses.forEach((c) => {
			const student = c.student;
			studentsMap.set(student.id, {
				id: student.id,
				name: `${student.firstName} ${student.lastName}`,
				email: student.email,
				role: student.role,
			});
		});

		return Array.from(studentsMap.values());
	} catch (error) {
		console.log(error);
		return [];
	}
}

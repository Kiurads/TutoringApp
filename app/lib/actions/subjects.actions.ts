"use server";

import prisma from "@/prisma";
import { SubjectData } from "./../types/subjects.types";

export async function fetchSubjects(): Promise<SubjectData[]> {
	const subjects = await prisma.subject.findMany();

	return subjects.map((subject) => ({
		id: subject.id,
		name: subject.name,
	}));
}

export async function fetchSubjectsByName(name: string) {
	return await prisma.subject.findMany({
		where: {
			name: {
				contains: name,
			},
		},
	});
}

export async function fetchSubjectsById(id: string) {
	return await prisma.subject.findUnique({
		where: {
			id: id,
		},
	});
}

export async function fetchSubjectsWithTeachers() {
	return await prisma.subject.findMany({
		where: {
			teacherSubject: {
				some: {}, // Ensures that there is at least one associated teacher
			},
		},
	});
}

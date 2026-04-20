"use server";

import prisma from "@/prisma";
import { SubjectData } from "./../types/subjects.types";

export async function fetchSubjects(): Promise<SubjectData[]> {
	const subjects = await prisma.subject.findMany({
		include: {
			_count: {
				select: { teacherSubject: true },
			},
		},
	});

	return subjects.map((subject) => ({
		id: subject.id,
		name: subject.name,
		teacherCount: subject._count.teacherSubject,
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

export async function fetchSubjectsByTeacherId(
	teacherId: string
): Promise<{ id: string; name: string }[]> {
	const teacherSubjects = await prisma.teacherSubject.findMany({
		where: { teacherId },
		select: { subject: { select: { id: true, name: true } } },
	});

	return teacherSubjects.map((ts) => ts.subject);
}

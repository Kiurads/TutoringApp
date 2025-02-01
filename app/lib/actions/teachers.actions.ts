"use server";

import prisma from "@/prisma";

export async function fetchTeachersBySubjectsId(subjects?: string[]) {
	const teachers = await prisma.teacher.findMany({
		where: {
			teacherSubject: {
				some: {
					subject: {
						id: {
							in: subjects,
						},
					},
				},
			},
		},
		select: {
			id: true,
			user: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	return teachers;
}

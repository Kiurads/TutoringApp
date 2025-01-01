import prisma from "@/prisma";

export async function fetchTeachersBySubjects(subjects?: string[]) {
	const teachers = await prisma.teacher.findMany({
		where: {
			teacherSubject: {
				some: {
					subject: {
						name: {
							in: subjects,
						},
					},
				},
			},
		},
	});

	return teachers;
}

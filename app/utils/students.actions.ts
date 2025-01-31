import prisma from "@/prisma";

export async function fetchStudents() {
	try {
		const students = await prisma.user.findMany({
			where: {
				role: "student",
			},
		});

		return students;
	} catch (error) {
		console.log(error);
	}
}

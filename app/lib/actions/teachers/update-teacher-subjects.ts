"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";

export async function updateTeacherSubjects(
	subjectIds: string[]
): Promise<{ error?: string; success?: boolean }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});
	if (!user) return { error: "User not found." };
	if (user.role !== "teacher") return { error: "Only teachers can update subjects." };

	try {
		// Full replace: drop whatever isn't in the new list, add whatever is
		// missing. skipDuplicates covers the ones that were already there.
		await prisma.teacherSubject.deleteMany({
			where: { teacherId: user.id, subjectId: { notIn: subjectIds } },
		});
		await prisma.teacherSubject.createMany({
			data: subjectIds.map((subjectId) => ({ teacherId: user.id, subjectId })),
			skipDuplicates: true,
		});
	} catch (error) {
		console.error("Failed to update teacher subjects:", error);
		return { error: "Something went wrong, please try again." };
	}

	revalidatePath("/main/teacher/profile");
	return { success: true };
}

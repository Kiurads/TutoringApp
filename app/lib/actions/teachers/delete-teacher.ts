"use server";

import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function deleteTeacherById(
	teacherId: string
): Promise<void> {
	// Delete associated data first to avoid foreign key constraint issues
	await prisma.teacherSubject.deleteMany({
		where: { teacherId },
	});

	await prisma.teacherRating.deleteMany({
		where: { teacherId },
	});

	// Finally, delete the teacher
	await prisma.user.delete({
		where: { id: teacherId },
	});

	revalidatePath("/main/admin/teachers");
	redirect("/main/admin/teachers");
}

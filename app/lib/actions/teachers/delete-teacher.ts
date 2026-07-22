"use server";

import prisma from "@/prisma";
import { revalidatePath } from "next/cache";

// Deliberately does not redirect() here — this is called directly from a
// client component's onClick (not a <form action>), and redirect() throws a
// special Next.js error to perform the navigation; a caller wrapping this in
// try/catch for its own error handling would swallow that and silently break
// the redirect. The client navigates itself via useRouter().push() instead.
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
}

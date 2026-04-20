"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { parseAvatarOptions } from "@/app/lib/avatar-utils";

export async function saveAvatarOptions(
	optionsJson: string,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	// Validate that the JSON is parseable
	if (!parseAvatarOptions(optionsJson)) return { error: "Invalid options." };

	await prisma.user.update({
		where: { email: session.user.email },
		data: { avatarOptions: optionsJson },
	});

	revalidatePath("/main/student/profile");
	revalidatePath("/main/teacher/profile");
	revalidatePath("/main/student/dashboard");
	revalidatePath("/main/teacher/dashboard");

	return {};
}

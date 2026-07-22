"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { getClientIp, rateLimit } from "@/app/lib/auth/rate-limit";

// Deter brute-forcing the current password: cap attempts per user regardless
// of whether they succeed, since a correct guess here is a full account
// takeover (unlike, say, a wrong profile field).
const CHANGE_PASSWORD_MAX_ATTEMPTS = 5;
const CHANGE_PASSWORD_WINDOW_MS = 15 * 60_000;

export async function changePassword(data: {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}): Promise<{ error?: string; success?: boolean }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	if (!data.currentPassword) return { error: "Enter your current password." };
	if (data.newPassword.length < 8) {
		return { error: "New password must be at least 8 characters." };
	}
	if (data.newPassword !== data.confirmPassword) {
		return { error: "New passwords do not match." };
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});
	if (!user) return { error: "User not found." };

	// Rate-limit by user id (not IP) — this is an authenticated action, and
	// the account itself is what's at risk from repeated guessing.
	const ip = await getClientIp();
	const limit = rateLimit(
		`change-password:${user.id}:${ip}`,
		CHANGE_PASSWORD_MAX_ATTEMPTS,
		CHANGE_PASSWORD_WINDOW_MS
	);
	if (!limit.allowed) {
		return {
			error: `Too many attempts. Please try again in ${Math.ceil(
				limit.retryAfterSeconds / 60
			)} minute(s).`,
		};
	}

	const currentPasswordValid = await bcrypt.compare(
		data.currentPassword,
		user.password
	);
	if (!currentPasswordValid) {
		return { error: "Current password is incorrect." };
	}

	if (data.currentPassword === data.newPassword) {
		return { error: "New password must be different from the current one." };
	}

	const hashedPassword = await bcrypt.hash(data.newPassword, 10);
	await prisma.user.update({
		where: { id: user.id },
		data: { password: hashedPassword },
	});

	return { success: true };
}

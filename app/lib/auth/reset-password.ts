"use server";

import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getClientIp, rateLimit } from "@/app/lib/auth/rate-limit";

// Deter brute-forcing the reset token itself.
const RESET_MAX_ATTEMPTS_PER_IP = 10;
const RESET_WINDOW_MS = 15 * 60_000;

export async function resetPassword(
	prevState: string | undefined,
	formData: FormData
) {
	const token = formData.get("token") as string | null;
	const password = formData.get("password") as string | null;
	const confirmPassword = formData.get("confirmPassword") as string | null;

	if (!token) return "This password reset link is invalid or has expired.";
	if (!password) return "Please enter a new password";
	if (password.length < 8) return "Password must be at least 8 characters.";
	if (password !== confirmPassword) return "Passwords do not match";

	const ip = await getClientIp();
	const ipLimit = rateLimit(
		`reset-consume:ip:${ip}`,
		RESET_MAX_ATTEMPTS_PER_IP,
		RESET_WINDOW_MS
	);
	if (!ipLimit.allowed) {
		return `Too many attempts. Please try again in ${Math.ceil(
			ipLimit.retryAfterSeconds / 60
		)} minute(s).`;
	}

	try {
		// token isn't declared @unique on its own (only the [identifier, token]
		// pair is), so look it up with findFirst. Scoped to PASSWORD_RESET so
		// an email-verification token (same table) can never be redeemed here.
		const verificationToken = await prisma.verificationToken.findFirst({
			where: { token, purpose: "PASSWORD_RESET" },
		});

		if (!verificationToken) {
			return "This password reset link is invalid or has already been used.";
		}

		const isExpired = verificationToken.expires < new Date();

		// Consume the token either way — a used or expired token should never
		// be redeemable again.
		await prisma.verificationToken
			.delete({
				where: {
					identifier_token: {
						identifier: verificationToken.identifier,
						token: verificationToken.token,
					},
				},
			})
			.catch(() => {
				// Already consumed by a concurrent request.
			});

		if (isExpired) {
			return "This password reset link has expired. Please request a new one.";
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await prisma.user.update({
			where: { email: verificationToken.identifier },
			// passwordChangedAt invalidates every session token issued before
			// this moment — see the jwt callback in auth.ts.
			data: { password: hashedPassword, passwordChangedAt: new Date() },
		});
	} catch (error) {
		console.error("Failed to reset password:", error);
		return "Something went wrong, please try again.";
	}

	redirect("/login?reset=success");
}

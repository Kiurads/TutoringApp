"use server";

import crypto from "crypto";
import prisma from "@/prisma";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { getClientIp, rateLimit } from "@/app/lib/auth/rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Deter abuse of the reset-request endpoint (which sends an email per
// call) — a rolling fifteen-minute window per IP and per email.
const RESET_REQUEST_MAX_ATTEMPTS = 3;
const RESET_REQUEST_WINDOW_MS = 15 * 60_000;

const GENERIC_SUCCESS_MESSAGE =
	"If an account exists for that email, we've sent a password reset link. It expires in 1 hour.";

export async function requestPasswordReset(
	prevState: string | undefined,
	formData: FormData
) {
	const email = (formData.get("email") as string | null)
		?.trim()
		.toLowerCase();

	if (!email) return "Please enter a valid email";

	const ip = await getClientIp();
	const emailLimit = rateLimit(
		`reset-request:email:${email}`,
		RESET_REQUEST_MAX_ATTEMPTS,
		RESET_REQUEST_WINDOW_MS
	);
	const ipLimit = rateLimit(
		`reset-request:ip:${ip}`,
		RESET_REQUEST_MAX_ATTEMPTS * 3,
		RESET_REQUEST_WINDOW_MS
	);

	if (!emailLimit.allowed || !ipLimit.allowed) {
		const retryAfterSeconds = Math.max(
			emailLimit.retryAfterSeconds,
			ipLimit.retryAfterSeconds
		);
		return `Too many reset requests. Please try again in ${Math.ceil(
			retryAfterSeconds / 60
		)} minute(s).`;
	}

	try {
		const user = await prisma.user.findUnique({ where: { email } });

		// Don't reveal whether the account exists — always return the same
		// generic message, but only actually send an email if it does.
		if (user) {
			const token = crypto.randomBytes(32).toString("hex");
			const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

			await prisma.verificationToken.create({
				data: { identifier: email, token, expires },
			});

			const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
			const resetUrl = `${appUrl}/reset-password?token=${token}`;

			await sendPasswordResetEmail(email, resetUrl);
		}
	} catch (error) {
		// Email/token issues here are logged but still return the generic
		// success message — same reasoning as elsewhere: don't leak account
		// existence, and don't turn a Resend hiccup into a visible failure.
		console.error(`Failed to process password reset request for ${email}:`, error);
	}

	return GENERIC_SUCCESS_MESSAGE;
}

import crypto from "crypto";
import prisma from "@/prisma";
import { sendVerificationEmail } from "@/app/lib/email";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAppUrl() {
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Creates a VerificationToken row for `email` and emails a verification
 * link. Best-effort: registration must succeed even if this fails (e.g.
 * Resend outage, missing RESEND_API_KEY), so all errors are caught and
 * logged here rather than propagated to the caller.
 */
export async function createAndSendVerificationEmail(email: string) {
	try {
		const token = crypto.randomBytes(32).toString("hex");
		const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

		await prisma.verificationToken.create({
			data: { identifier: email, token, expires },
		});

		const verifyUrl = `${getAppUrl()}/api/auth/verify?token=${token}`;

		await sendVerificationEmail(email, verifyUrl);
	} catch (error) {
		console.error(
			`Failed to create/send verification email for ${email} — registration still succeeds, but the user's emailVerified will remain unset until this is retried.`,
			error
		);
	}
}

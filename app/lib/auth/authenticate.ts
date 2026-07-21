"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { getClientIp, rateLimit } from "@/app/lib/auth/rate-limit";

// Deter credential stuffing: cap login attempts per email and per IP within
// a rolling one-minute window. See rate-limit.ts for storage caveats.
const LOGIN_MAX_ATTEMPTS_PER_EMAIL = 5;
const LOGIN_MAX_ATTEMPTS_PER_IP = 15;
const LOGIN_WINDOW_MS = 60_000;

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	const email = (formData.get("email") as string | null)?.trim().toLowerCase();
	const ip = await getClientIp();

	const emailLimit = rateLimit(
		`login:email:${email || "unknown"}`,
		LOGIN_MAX_ATTEMPTS_PER_EMAIL,
		LOGIN_WINDOW_MS
	);
	const ipLimit = rateLimit(
		`login:ip:${ip}`,
		LOGIN_MAX_ATTEMPTS_PER_IP,
		LOGIN_WINDOW_MS
	);

	if (!emailLimit.allowed || !ipLimit.allowed) {
		const retryAfterSeconds = Math.max(
			emailLimit.retryAfterSeconds,
			ipLimit.retryAfterSeconds
		);
		return `Too many login attempts. Please try again in ${retryAfterSeconds} second(s).`;
	}

	try {
		await signIn("credentials", formData);
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "Invalid credentials.";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}

	// Redirect to "/" and let auth.config.ts's `authorized()` callback route
	// the now-logged-in user to their role's dashboard. "/dashboard" isn't a
	// real route in this app — don't duplicate the role→path mapping here.
	redirect("/");
}

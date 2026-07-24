"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
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
		// signIn(provider, formData) treats FormData as both the credentials
		// payload AND its options object — with no `redirectTo`, it falls back
		// to the request's Referer header (i.e. "/login" itself) and redirects
		// there via its own internal `redirect()`. Passing a plain object with
		// `redirect: false` instead makes signIn just set the session cookie
		// and return, leaving navigation entirely to the caller.
		await signIn("credentials", {
			...Object.fromEntries(formData),
			redirect: false,
		});
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

	// Deliberately no redirect() here. A Server Action's redirect() drives
	// Next.js's client-side router, which can serve "/" from its Router
	// Cache/prefetch cache from before login — silently skipping middleware
	// and stranding the user on a stale logged-out render. LoginForm instead
	// does a full `window.location` navigation on success, guaranteeing a
	// fresh request that carries the new session cookie through middleware
	// (which then routes on to the role dashboard / teacher onboarding).
	return undefined;
}

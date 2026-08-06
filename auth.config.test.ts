import { describe, it, expect } from "vitest";
import { authConfig } from "./auth.config";

function nextUrl(pathname: string) {
	return new URL(`https://example.com${pathname}`);
}

describe("auth.config authorized callback", () => {
	it("redirects unauthenticated users away from protected routes", () => {
		const result = authConfig.callbacks.authorized({
			auth: null,
			request: { nextUrl: nextUrl("/main/teacher/dashboard") },
		} as never);

		expect(result).toBe(false);
	});

	it("allows unauthenticated users on public routes", () => {
		const result = authConfig.callbacks.authorized({
			auth: null,
			request: { nextUrl: nextUrl("/login") },
		} as never);

		expect(result).toBe(true);
	});

	it("forces a teacher who hasn't set teaching preferences to the onboarding page", () => {
		const result = authConfig.callbacks.authorized({
			auth: { user: { role: "teacher", teacherPreferencesSet: false } },
			request: { nextUrl: nextUrl("/main/teacher/classes") },
		} as never);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).headers.get("location")).toBe(
			"https://example.com/main/teacher/onboarding",
		);
	});

	it("does not redirect away from the onboarding page itself", () => {
		const result = authConfig.callbacks.authorized({
			auth: { user: { role: "teacher", teacherPreferencesSet: false } },
			request: { nextUrl: nextUrl("/main/teacher/onboarding") },
		} as never);

		expect(result).toBe(true);
	});

	it("allows a teacher who has set teaching preferences to browse freely", () => {
		const result = authConfig.callbacks.authorized({
			auth: { user: { role: "teacher", teacherPreferencesSet: true } },
			request: { nextUrl: nextUrl("/main/teacher/classes") },
		} as never);

		expect(result).toBe(true);
	});

	it("never gates students on teacherPreferencesSet", () => {
		const result = authConfig.callbacks.authorized({
			auth: { user: { role: "student", teacherPreferencesSet: false } },
			request: { nextUrl: nextUrl("/main/student/classes") },
		} as never);

		expect(result).toBe(true);
	});

	describe("/pt locale prefix (next-intl, as-needed mode)", () => {
		it("redirects unauthenticated users away from protected /pt routes", () => {
			const result = authConfig.callbacks.authorized({
				auth: null,
				request: { nextUrl: nextUrl("/pt/main/teacher/dashboard") },
			} as never);

			expect(result).toBe(false);
		});

		it("allows unauthenticated users on public /pt routes", () => {
			const result = authConfig.callbacks.authorized({
				auth: null,
				request: { nextUrl: nextUrl("/pt/login") },
			} as never);

			expect(result).toBe(true);
		});

		it("redirects a logged-in user on /pt/ (home) to their /pt-prefixed dashboard", () => {
			const result = authConfig.callbacks.authorized({
				auth: { user: { role: "student", teacherPreferencesSet: true } },
				request: { nextUrl: nextUrl("/pt") },
			} as never);

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).headers.get("location")).toBe(
				"https://example.com/pt/main/student/dashboard",
			);
		});

		it("redirects a role mismatch on a /pt route to the /pt-prefixed role dashboard", () => {
			const result = authConfig.callbacks.authorized({
				auth: { user: { role: "student", teacherPreferencesSet: true } },
				request: { nextUrl: nextUrl("/pt/main/teacher/dashboard") },
			} as never);

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).headers.get("location")).toBe(
				"https://example.com/pt/main/student/dashboard",
			);
		});

		it("forces a teacher who hasn't set teaching preferences to the /pt-prefixed onboarding page", () => {
			const result = authConfig.callbacks.authorized({
				auth: { user: { role: "teacher", teacherPreferencesSet: false } },
				request: { nextUrl: nextUrl("/pt/main/teacher/classes") },
			} as never);

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).headers.get("location")).toBe(
				"https://example.com/pt/main/teacher/onboarding",
			);
		});

		it("does not redirect away from the /pt-prefixed onboarding page itself", () => {
			const result = authConfig.callbacks.authorized({
				auth: { user: { role: "teacher", teacherPreferencesSet: false } },
				request: { nextUrl: nextUrl("/pt/main/teacher/onboarding") },
			} as never);

			expect(result).toBe(true);
		});

		it("allows a /pt route on the user's own role page through untouched", () => {
			const result = authConfig.callbacks.authorized({
				auth: { user: { role: "student", teacherPreferencesSet: true } },
				request: { nextUrl: nextUrl("/pt/main/student/classes") },
			} as never);

			expect(result).toBe(true);
		});

		it("does not treat a route merely starting with 'pt' as locale-prefixed", () => {
			// Guards against the /^\/pt(\/|$)/ match being too loose — a route
			// literally named /ptsomething must not be mistaken for /pt/something.
			const result = authConfig.callbacks.authorized({
				auth: null,
				request: { nextUrl: nextUrl("/ptsomething") },
			} as never);

			expect(result).toBe(true);
		});
	});
});

describe("auth.config jwt callback", () => {
	it("copies role and teacherPreferencesSet onto the token at login", async () => {
		const token = await authConfig.callbacks.jwt({
			token: {},
			user: { role: "teacher", teacherPreferencesSet: false },
		} as never);

		expect(token.role).toBe("teacher");
		expect(token.teacherPreferencesSet).toBe(false);
	});

	it("stamps passwordChangedAt onto the token at login as an epoch number", async () => {
		const changedAt = new Date("2026-01-01T00:00:00.000Z");
		const token = await authConfig.callbacks.jwt({
			token: {},
			user: { role: "student", passwordChangedAt: changedAt },
		} as never);

		expect(token.passwordChangedAt).toBe(changedAt.getTime());
	});

	it("stamps passwordChangedAt as null when the password has never been changed", async () => {
		const token = await authConfig.callbacks.jwt({
			token: {},
			user: { role: "student", passwordChangedAt: null },
		} as never);

		expect(token.passwordChangedAt).toBeNull();
	});

	it("updates teacherPreferencesSet when the client calls session.update()", async () => {
		const token = await authConfig.callbacks.jwt({
			token: { role: "teacher", teacherPreferencesSet: false },
			user: undefined,
			trigger: "update",
			session: { teacherPreferencesSet: true },
		} as never);

		expect(token.teacherPreferencesSet).toBe(true);
	});

	it("leaves the token untouched on unrelated updates", async () => {
		const token = await authConfig.callbacks.jwt({
			token: { role: "teacher", teacherPreferencesSet: false },
			user: undefined,
			trigger: "update",
			session: {},
		} as never);

		expect(token.teacherPreferencesSet).toBe(false);
	});
});

describe("auth.config session callback", () => {
	it("forwards role and teacherPreferencesSet onto session.user", async () => {
		const session = await authConfig.callbacks.session({
			session: { user: {} },
			token: { role: "teacher", teacherPreferencesSet: true },
		} as never);

		expect(session.user?.role).toBe("teacher");
		expect(session.user?.teacherPreferencesSet).toBe(true);
	});

	// The bug this fix closes: a stale JWT (issued before a password change)
	// kept presenting a valid, working user session indefinitely.
	it("strips session.user when the token was marked invalidated", async () => {
		const session = await authConfig.callbacks.session({
			session: { user: { role: "teacher" }, expires: "2026-01-01T00:00:00.000Z" },
			token: { role: "teacher", teacherPreferencesSet: true, invalidated: true },
		} as never);

		expect(session.user).toBeUndefined();
	});
});

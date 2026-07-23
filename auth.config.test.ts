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
});

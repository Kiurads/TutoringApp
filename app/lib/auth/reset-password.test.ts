import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import { resetPassword } from "./reset-password";

vi.mock("@/prisma", () => ({
	default: {
		verificationToken: { findFirst: vi.fn(), delete: vi.fn() },
		user: { update: vi.fn() },
	},
}));

vi.mock("bcryptjs", () => ({
	default: { hash: vi.fn().mockResolvedValue("hashed") },
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/app/lib/auth/rate-limit", () => ({
	getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
	rateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

function formData(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) fd.append(key, value);
	return fd;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.verificationToken.delete).mockResolvedValue({} as never);
});

describe("resetPassword", () => {
	it("resets the password and redirects on a valid PASSWORD_RESET token", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
			identifier: "user@test.com",
			token: "tok123",
			expires: new Date(Date.now() + 60_000),
			purpose: "PASSWORD_RESET",
		} as never);

		await resetPassword(
			undefined,
			formData({ token: "tok123", password: "newpass123", confirmPassword: "newpass123" }),
		);

		expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
			where: { token: "tok123", purpose: "PASSWORD_RESET" },
		});
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { email: "user@test.com" },
			data: { password: "hashed", passwordChangedAt: expect.any(Date) },
		});
		expect(redirect).toHaveBeenCalledWith("/login?reset=success");
	});

	// Stamping passwordChangedAt is what lets auth.ts's jwt callback detect
	// and invalidate every session token issued before this moment — see
	// app/lib/auth/session-staleness.ts.
	it("stamps passwordChangedAt so existing sessions can be invalidated", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
			identifier: "user@test.com",
			token: "tok123",
			expires: new Date(Date.now() + 60_000),
			purpose: "PASSWORD_RESET",
		} as never);

		await resetPassword(
			undefined,
			formData({ token: "tok123", password: "newpass123", confirmPassword: "newpass123" }),
		);

		const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
		expect((updateCall.data as { passwordChangedAt: Date }).passwordChangedAt).toBeInstanceOf(Date);
	});

	// The bug this fix closes: an email-verification token must never be
	// accepted here, even if it's a genuine, unexpired, existing token —
	// findFirst is scoped by purpose, so a verification token simply never
	// matches this lookup.
	it("rejects a token that belongs to email verification, not password reset", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

		const result = await resetPassword(
			undefined,
			formData({ token: "verify-tok", password: "newpass123", confirmPassword: "newpass123" }),
		);

		expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
			where: { token: "verify-tok", purpose: "PASSWORD_RESET" },
		});
		expect(result).toBe("This password reset link is invalid or has already been used.");
		expect(prisma.user.update).not.toHaveBeenCalled();
		expect(redirect).not.toHaveBeenCalled();
	});

	it("rejects an expired token", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
			identifier: "user@test.com",
			token: "tok123",
			expires: new Date(Date.now() - 60_000),
			purpose: "PASSWORD_RESET",
		} as never);

		const result = await resetPassword(
			undefined,
			formData({ token: "tok123", password: "newpass123", confirmPassword: "newpass123" }),
		);

		expect(result).toBe("This password reset link has expired. Please request a new one.");
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects mismatched passwords without touching the database", async () => {
		const result = await resetPassword(
			undefined,
			formData({ token: "tok123", password: "newpass123", confirmPassword: "different" }),
		);

		expect(result).toBe("Passwords do not match");
		expect(prisma.verificationToken.findFirst).not.toHaveBeenCalled();
	});
});

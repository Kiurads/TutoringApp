import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/prisma";
import { GET } from "./route";

vi.mock("@/prisma", () => ({
	default: {
		verificationToken: { findFirst: vi.fn(), delete: vi.fn() },
		user: { update: vi.fn() },
	},
}));

function makeRequest(query: string) {
	return new NextRequest(`http://localhost/api/auth/verify${query}`);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.verificationToken.delete).mockResolvedValue({} as never);
});

describe("GET /api/auth/verify", () => {
	it("redirects to missing-token when no token is provided", async () => {
		const response = await GET(makeRequest(""));

		expect(response.headers.get("location")).toBe("http://localhost/login?verify=missing-token");
		expect(prisma.verificationToken.findFirst).not.toHaveBeenCalled();
	});

	it("verifies the email and redirects to success on a valid EMAIL_VERIFICATION token", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
			identifier: "user@test.com",
			token: "tok123",
			expires: new Date(Date.now() + 60_000),
			purpose: "EMAIL_VERIFICATION",
		} as never);
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);

		const response = await GET(makeRequest("?token=tok123"));

		expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
			where: { token: "tok123", purpose: "EMAIL_VERIFICATION" },
		});
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { email: "user@test.com" },
			data: { emailVerified: expect.any(Date) },
		});
		expect(response.headers.get("location")).toBe("http://localhost/login?verify=success");
	});

	// The bug this fix closes: a password-reset token must never verify an
	// email, even if it's a genuine, unexpired, existing token — findFirst
	// is scoped by purpose, so a reset token simply never matches here.
	it("treats a token that belongs to password reset, not email verification, as invalid", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

		const response = await GET(makeRequest("?token=reset-tok"));

		expect(prisma.verificationToken.findFirst).toHaveBeenCalledWith({
			where: { token: "reset-tok", purpose: "EMAIL_VERIFICATION" },
		});
		expect(response.headers.get("location")).toBe("http://localhost/login?verify=invalid-token");
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("redirects to expired-token for an expired token", async () => {
		vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
			identifier: "user@test.com",
			token: "tok123",
			expires: new Date(Date.now() - 60_000),
			purpose: "EMAIL_VERIFICATION",
		} as never);

		const response = await GET(makeRequest("?token=tok123"));

		expect(response.headers.get("location")).toBe("http://localhost/login?verify=expired-token");
		expect(prisma.user.update).not.toHaveBeenCalled();
	});
});

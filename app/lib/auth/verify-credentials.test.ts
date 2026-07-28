import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import { verifyCredentials } from "./verify-credentials";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn() },
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("verifyCredentials", () => {
	it("returns the shaped user on a correct password", async () => {
		const hash = await bcrypt.hash("correct-password", 10);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "u1",
			email: "s@test.com",
			password: hash,
			role: "student",
			teachingStyle: null,
			passwordChangedAt: null,
		} as never);

		const result = await verifyCredentials("s@test.com", "correct-password");

		expect(result).toEqual({
			id: "u1",
			email: "s@test.com",
			role: "student",
			teacherPreferencesSet: true,
			passwordChangedAt: null,
		});
	});

	it("returns null for a wrong password", async () => {
		const hash = await bcrypt.hash("correct-password", 10);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "u1",
			email: "s@test.com",
			password: hash,
			role: "student",
			teachingStyle: null,
			passwordChangedAt: null,
		} as never);

		const result = await verifyCredentials("s@test.com", "wrong-password");

		expect(result).toBeNull();
	});

	it("returns null when no user exists for the email", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await verifyCredentials("nobody@test.com", "whatever-password");

		expect(result).toBeNull();
	});

	// The bug this fix closes: comparing only when a user exists made a
	// nonexistent-account attempt return near-instantly while a
	// wrong-password one paid bcrypt's full compare cost, letting an
	// attacker enumerate registered emails purely from response timing.
	it("takes roughly the same time whether the account exists or not", async () => {
		const hash = await bcrypt.hash("correct-password", 10);
		vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
			id: "u1",
			email: "s@test.com",
			password: hash,
			role: "student",
			teachingStyle: null,
			passwordChangedAt: null,
		} as never);
		const existingStart = performance.now();
		await verifyCredentials("s@test.com", "wrong-password");
		const existingDuration = performance.now() - existingStart;

		vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
		const missingStart = performance.now();
		await verifyCredentials("nobody@test.com", "wrong-password");
		const missingDuration = performance.now() - missingStart;

		// Both paths run a real bcrypt compare of the same cost factor, so
		// neither duration should be more than a few times the other — CI/local
		// jitter can easily cause a 2-3x wobble, but the bug this guards
		// against (skipping the compare entirely for a nonexistent account)
		// produces a gap of two-plus orders of magnitude, not a small multiple.
		const ratio =
			Math.max(existingDuration, missingDuration) /
			Math.max(Math.min(existingDuration, missingDuration), 0.1);
		expect(ratio).toBeLessThan(8);
	});

	it("marks a teacher's preferences as set when teachingStyle is present", async () => {
		const hash = await bcrypt.hash("correct-password", 10);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "t1",
			email: "t@test.com",
			password: hash,
			role: "teacher",
			teachingStyle: "socratic",
			passwordChangedAt: null,
		} as never);

		const result = await verifyCredentials("t@test.com", "correct-password");

		expect(result?.teacherPreferencesSet).toBe(true);
	});

	it("marks a teacher's preferences as not set when teachingStyle is null", async () => {
		const hash = await bcrypt.hash("correct-password", 10);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "t1",
			email: "t@test.com",
			password: hash,
			role: "teacher",
			teachingStyle: null,
			passwordChangedAt: null,
		} as never);

		const result = await verifyCredentials("t@test.com", "correct-password");

		expect(result?.teacherPreferencesSet).toBe(false);
	});
});

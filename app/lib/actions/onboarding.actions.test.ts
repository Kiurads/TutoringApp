import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { completeOnboardingTour } from "./onboarding.actions";

vi.mock("@/prisma", () => ({
	default: {
		user: { update: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("completeOnboardingTour", () => {
	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await completeOnboardingTour();

		expect(result).toEqual({ error: "Not authenticated." });
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("marks the session user's onboarding as complete", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "student@test.com" } } as never);
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);

		const result = await completeOnboardingTour();

		expect(result).toEqual({});
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { email: "student@test.com" },
			data: { hasCompletedOnboarding: true },
		});
	});
});

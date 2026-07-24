import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { awardSparks } from "@/app/lib/gamification";
import { updateProfile } from "./users.actions";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn(), update: vi.fn() },
		teacherGameProfile: { upsert: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/gamification", () => ({ awardSparks: vi.fn() }));

function mockTeacher(overrides: Record<string, unknown> = {}) {
	return {
		id: "t1",
		role: "teacher",
		teacherGameProfile: null,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
});

describe("updateProfile", () => {
	it("saves the profile and redirects successfully on the happy path", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher() as never);
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);
		vi.mocked(prisma.teacherGameProfile.upsert).mockResolvedValue({} as never);

		const result = await updateProfile({
			firstName: "",
			lastName: "",
			teachingStyle: "socratic",
			pricePerHour: 20,
		});

		expect(result).toEqual({});
		expect(awardSparks).toHaveBeenCalledWith("t1", 150);
	});

	it("still saves the profile and returns success even when the one-time reward fails", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher() as never);
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);
		vi.mocked(prisma.teacherGameProfile.upsert).mockRejectedValue(new Error("race condition"));

		const result = await updateProfile({
			firstName: "",
			lastName: "",
			teachingStyle: "socratic",
			pricePerHour: 20,
		});

		expect(result).toEqual({});
		expect(prisma.user.update).toHaveBeenCalled();
	});

	it("skips the reward block entirely when the profile was already completed", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(
			mockTeacher({ teacherGameProfile: { profileCompleted: true } }) as never,
		);
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);

		const result = await updateProfile({
			firstName: "",
			lastName: "",
			teachingStyle: "socratic",
			pricePerHour: 20,
		});

		expect(result).toEqual({});
		expect(prisma.teacherGameProfile.upsert).not.toHaveBeenCalled();
		expect(awardSparks).not.toHaveBeenCalled();
	});

	it("returns a friendly error instead of throwing when the core save fails", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(mockTeacher() as never);
		vi.mocked(prisma.user.update).mockRejectedValue(new Error("connection lost"));

		const result = await updateProfile({
			firstName: "",
			lastName: "",
			teachingStyle: "socratic",
			pricePerHour: 20,
		});

		expect(result).toEqual({ error: "Something went wrong. Please try again." });
	});

	it("returns an error without touching the DB when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await updateProfile({
			firstName: "",
			lastName: "",
			teachingStyle: "socratic",
			pricePerHour: 20,
		});

		expect(result).toEqual({ error: "Not authenticated." });
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});
});

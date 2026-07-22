import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { purchaseStoreItem, fetchStudentStoreState } from "./store.actions";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn() },
		studentGameProfile: { update: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockSession = { user: { email: "test@test.com" } };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("purchaseStoreItem", () => {
	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);
		expect(await purchaseStoreItem("streak_freeze")).toEqual({ error: "Not authenticated." });
	});

	it("returns an error for an unknown item", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		// @ts-expect-error deliberately invalid key
		expect(await purchaseStoreItem("not_a_real_item")).toEqual({ error: "Item not found." });
	});

	it("returns an error when the student can't afford it", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			studentGameProfile: { id: "p1", insightGems: 50, ownedFrames: "", studyBoostActive: false, priorityBooking: false },
		} as never);

		const result = await purchaseStoreItem("streak_freeze"); // costs 150

		expect(result.error).toMatch(/Not enough gems/);
		expect(prisma.studentGameProfile.update).not.toHaveBeenCalled();
	});

	it("increments streakFreezes (stacking, not a boolean flag) on purchase", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			studentGameProfile: { id: "p1", insightGems: 500, ownedFrames: "", studyBoostActive: false, priorityBooking: false },
		} as never);

		const result = await purchaseStoreItem("streak_freeze");

		expect(result).toEqual({});
		expect(prisma.studentGameProfile.update).toHaveBeenCalledWith({
			where: { userId: "student1" },
			data: { insightGems: { decrement: 150 }, streakFreezes: { increment: 1 } },
		});
	});

	it("allows buying a second streak_freeze even with one already owned (no 'already active' gate)", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			studentGameProfile: {
				id: "p1", insightGems: 500, ownedFrames: "", studyBoostActive: false, priorityBooking: false,
			},
		} as never);

		const result = await purchaseStoreItem("streak_freeze");

		expect(result).toEqual({});
	});

	it("still blocks a second study_boost purchase while one is active", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			studentGameProfile: {
				id: "p1", insightGems: 500, ownedFrames: "", studyBoostActive: true, priorityBooking: false,
			},
		} as never);

		const result = await purchaseStoreItem("study_boost");

		expect(result.error).toMatch(/already have an active Study Boost/);
		expect(prisma.studentGameProfile.update).not.toHaveBeenCalled();
	});

	it("rejects buying an already-owned cosmetic frame", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			studentGameProfile: {
				id: "p1", insightGems: 5000, ownedFrames: "scholar", studyBoostActive: false, priorityBooking: false,
			},
		} as never);

		const result = await purchaseStoreItem("frame_scholar");

		expect(result.error).toMatch(/already own this frame/);
	});
});

describe("fetchStudentStoreState", () => {
	it("returns streakFreezes from the profile, defaulting to 0", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			avatarOptions: null,
			studentGameProfile: null,
		} as never);

		const state = await fetchStudentStoreState();

		expect(state.streakFreezes).toBe(0);
	});

	it("surfaces a real streakFreezes count", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			avatarOptions: null,
			studentGameProfile: {
				insightGems: 0, ownedFrames: "", activeFrame: null,
				studyBoostActive: false, priorityBooking: false, streakFreezes: 3,
			},
		} as never);

		const state = await fetchStudentStoreState();

		expect(state.streakFreezes).toBe(3);
	});
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./actions/users.actions";
import { awardGems, awardSparks } from "./gamification";
import { fetchWeeklyQuests, claimWeeklyQuest } from "./quests";

vi.mock("@/prisma", () => ({
	default: {
		class: { count: vi.fn() },
		teacherRating: { count: vi.fn() },
		questClaim: { findMany: vi.fn(), create: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./actions/users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("./gamification", () => ({ awardGems: vi.fn(), awardSparks: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockSession = { user: { email: "test@test.com" } };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("fetchWeeklyQuests", () => {
	it("returns an empty list when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);
		expect(await fetchWeeklyQuests()).toEqual([]);
	});

	it("returns an empty list for admins", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "admin1", role: "admin" } as never);
		expect(await fetchWeeklyQuests()).toEqual([]);
	});

	it("returns student quests with live progress and claim status", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.questClaim.findMany).mockResolvedValue([
			{ questKey: "weekly_leave_review" },
		] as never);
		vi.mocked(prisma.class.count).mockResolvedValue(1); // 1 of 2 needed
		vi.mocked(prisma.teacherRating.count).mockResolvedValue(1); // already met, already claimed

		const quests = await fetchWeeklyQuests();

		expect(quests).toHaveLength(2);
		const classesQuest = quests.find((q) => q.key === "weekly_2_classes")!;
		expect(classesQuest.progress).toBe(1);
		expect(classesQuest.completed).toBe(false);
		expect(classesQuest.claimed).toBe(false);

		const reviewQuest = quests.find((q) => q.key === "weekly_leave_review")!;
		expect(reviewQuest.completed).toBe(true);
		expect(reviewQuest.claimed).toBe(true);
	});

	it("caps progress display at the target even if the real count is higher", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.questClaim.findMany).mockResolvedValue([]);
		vi.mocked(prisma.class.count).mockResolvedValue(5); // target is 2
		vi.mocked(prisma.teacherRating.count).mockResolvedValue(0);

		const quests = await fetchWeeklyQuests();

		const classesQuest = quests.find((q) => q.key === "weekly_2_classes")!;
		expect(classesQuest.progress).toBe(2);
		expect(classesQuest.completed).toBe(true);
	});

	it("returns teacher quests for a teacher", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "teacher1", role: "teacher" } as never);
		vi.mocked(prisma.questClaim.findMany).mockResolvedValue([]);
		vi.mocked(prisma.class.count).mockResolvedValue(3);

		const quests = await fetchWeeklyQuests();

		expect(quests).toHaveLength(1);
		expect(quests[0].key).toBe("weekly_3_classes");
		expect(quests[0].completed).toBe(true);
	});
});

describe("claimWeeklyQuest", () => {
	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);
		expect(await claimWeeklyQuest("weekly_2_classes")).toEqual({ error: "Not authenticated." });
	});

	it("returns an error for an unknown quest key", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);

		expect(await claimWeeklyQuest("not_a_real_quest")).toEqual({ error: "Unknown quest." });
	});

	it("refuses to claim when server-recomputed progress isn't actually complete", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.class.count).mockResolvedValue(1); // target is 2

		const result = await claimWeeklyQuest("weekly_2_classes");

		expect(result).toEqual({ error: "This quest isn't complete yet." });
		expect(awardGems).not.toHaveBeenCalled();
	});

	it("awards gems and records the claim when a student quest is complete", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.class.count).mockResolvedValue(2);
		vi.mocked(prisma.questClaim.create).mockResolvedValue({} as never);

		const result = await claimWeeklyQuest("weekly_2_classes");

		expect(result).toEqual({});
		expect(prisma.questClaim.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ userId: "student1", questKey: "weekly_2_classes" }) }),
		);
		expect(awardGems).toHaveBeenCalledWith("student1", 30);
	});

	it("awards sparks for a teacher quest instead of gems", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "teacher1", role: "teacher" } as never);
		vi.mocked(prisma.class.count).mockResolvedValue(3);
		vi.mocked(prisma.questClaim.create).mockResolvedValue({} as never);

		await claimWeeklyQuest("weekly_3_classes");

		expect(awardSparks).toHaveBeenCalledWith("teacher1", 30);
		expect(awardGems).not.toHaveBeenCalled();
	});

	it("returns an error when the quest was already claimed this week", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.class.count).mockResolvedValue(2);
		vi.mocked(prisma.questClaim.create).mockRejectedValue(new Error("Unique constraint failed"));

		const result = await claimWeeklyQuest("weekly_2_classes");

		expect(result).toEqual({ error: "Already claimed this week." });
		expect(awardGems).not.toHaveBeenCalled();
	});

	it("rejects a student trying to claim a teacher-only quest", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);

		const result = await claimWeeklyQuest("weekly_3_classes");

		expect(result).toEqual({ error: "Unknown quest." });
	});
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import {
	awardGems,
	awardSparks,
	reverseClassPoints,
	updateActivityStreak,
	maybeAwardLuckyBonus,
} from "./gamification";
import { computeStreakUpdate } from "./gamification-utils";

vi.mock("@/prisma", () => ({
	default: {
		studentGameProfile: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
		teacherGameProfile: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
		class: { update: vi.fn() },
		badge: { findUnique: vi.fn() },
		userBadge: { create: vi.fn() },
	},
}));

vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("awardGems", () => {
	it("increments gems from an existing profile", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 100 } as never);

		await awardGems("student1", 50);

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith({
			where: { userId: "student1" },
			create: { userId: "student1", insightGems: 150 },
			update: { insightGems: 150 },
		});
	});

	it("fires a tier-up notification when gems cross a threshold", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 480 } as never);

		await awardGems("student1", 50); // 480 -> 530, crosses the 500 threshold into tier 1

		expect(prisma.studentGameProfile.update).toHaveBeenCalledWith({
			where: { userId: "student1" },
			data: { learningTier: 1 },
		});
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"tier_up",
			expect.any(String),
			expect.any(String),
			expect.any(String),
		);
	});

	it("does NOT fire a tier-up notification when a negative amount drops the tier", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 520 } as never);

		await awardGems("student1", -50); // 520 -> 470, drops back out of tier 1

		expect(prisma.studentGameProfile.update).not.toHaveBeenCalled();
		expect(createNotification).not.toHaveBeenCalled();
	});

	it("floors at 0 rather than going negative", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 30 } as never);

		await awardGems("student1", -50);

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { insightGems: 0 } }),
		);
	});

	it("treats a missing profile as 0 gems", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue(null);

		await awardGems("student1", 20);

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ create: { userId: "student1", insightGems: 20 } }),
		);
	});
});

describe("awardSparks", () => {
	it("does NOT fire a rank-up notification when a negative amount drops the rank", async () => {
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 520 } as never);

		await awardSparks("teacher1", -50); // 520 -> 470, drops back below the 500 threshold

		expect(prisma.teacherGameProfile.update).not.toHaveBeenCalled();
		expect(createNotification).not.toHaveBeenCalled();
	});

	it("floors at 0 rather than going negative", async () => {
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 10 } as never);

		await awardSparks("teacher1", -50);

		expect(prisma.teacherGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { reputationSparks: 0 } }),
		);
	});
});

describe("reverseClassPoints", () => {
	const baseClass = {
		id: "class1",
		studentId: "student1",
		teacherId: "teacher1",
		gemsAwarded: 100,
		sparksAwarded: 50,
		pointsReversed: false,
	};

	it("subtracts exactly what was awarded from both parties", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 200 } as never);
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 150 } as never);

		await reverseClassPoints(baseClass);

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { insightGems: 100 } }), // 200 - 100
		);
		expect(prisma.teacherGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { reputationSparks: 100 } }), // 150 - 50
		);
	});

	it("marks the class as reversed and zeroes out the tracked amounts", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 200 } as never);
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 150 } as never);

		await reverseClassPoints(baseClass);

		expect(prisma.class.update).toHaveBeenCalledWith({
			where: { id: "class1" },
			data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
		});
	});

	it("is a no-op when points were already reversed", async () => {
		await reverseClassPoints({ ...baseClass, pointsReversed: true });

		expect(prisma.studentGameProfile.upsert).not.toHaveBeenCalled();
		expect(prisma.teacherGameProfile.upsert).not.toHaveBeenCalled();
		expect(prisma.class.update).not.toHaveBeenCalled();
	});

	it("skips the teacher side when the class has no teacher", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 200 } as never);

		await reverseClassPoints({ ...baseClass, teacherId: null });

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalled();
		expect(prisma.teacherGameProfile.upsert).not.toHaveBeenCalled();
	});

	it("skips awardGems/awardSparks entirely when nothing was awarded", async () => {
		await reverseClassPoints({ ...baseClass, gemsAwarded: 0, sparksAwarded: 0 });

		expect(prisma.studentGameProfile.upsert).not.toHaveBeenCalled();
		expect(prisma.teacherGameProfile.upsert).not.toHaveBeenCalled();
		// Still marks the class as reversed, even though there was nothing to subtract.
		expect(prisma.class.update).toHaveBeenCalledWith({
			where: { id: "class1" },
			data: { pointsReversed: true, gemsAwarded: 0, sparksAwarded: 0 },
		});
	});
});

describe("computeStreakUpdate", () => {
	// Anchor everything off a fixed reference week rather than real-world
	// weekdays — only the *relative* week distance matters to this function.
	const WEEK_0 = new Date("2026-06-01T00:00:00.000Z"); // a Monday
	const WEEK_1 = new Date(WEEK_0.getTime() + 7 * 24 * 3_600_000);
	const WEEK_2 = new Date(WEEK_0.getTime() + 14 * 24 * 3_600_000);
	const WEEK_3 = new Date(WEEK_0.getTime() + 21 * 24 * 3_600_000);

	it("treats no prior activity as a fresh start", () => {
		expect(computeStreakUpdate(null, WEEK_0)).toEqual({ kind: "first_activity" });
	});

	it("treats a profile with no lastActivityAt as a fresh start", () => {
		const before = { currentStreakWeeks: 0, longestStreakWeeks: 0, streakFreezes: 0, lastActivityAt: null };
		expect(computeStreakUpdate(before, WEEK_0)).toEqual({ kind: "first_activity" });
	});

	it("does not change anything for a second activity in the same week", () => {
		const before = { currentStreakWeeks: 3, longestStreakWeeks: 5, streakFreezes: 0, lastActivityAt: WEEK_0 };
		// A few days later, same week
		const laterSameWeek = new Date(WEEK_0.getTime() + 3 * 24 * 3_600_000);
		expect(computeStreakUpdate(before, laterSameWeek)).toEqual({ kind: "already_counted" });
	});

	it("increments the streak for activity in the immediately following week", () => {
		const before = { currentStreakWeeks: 3, longestStreakWeeks: 5, streakFreezes: 0, lastActivityAt: WEEK_0 };
		expect(computeStreakUpdate(before, WEEK_1)).toEqual({
			kind: "continued",
			newStreak: 4,
			newLongest: 5,
			newFreezes: 1, // 4 is a multiple of FREEZE_EARNED_EVERY_N_WEEKS
			usedFreeze: false,
		});
	});

	it("updates longestStreakWeeks when the current streak becomes a new personal best", () => {
		const before = { currentStreakWeeks: 5, longestStreakWeeks: 5, streakFreezes: 0, lastActivityAt: WEEK_0 };
		const result = computeStreakUpdate(before, WEEK_1);
		expect(result).toMatchObject({ kind: "continued", newStreak: 6, newLongest: 6 });
	});

	it("breaks the streak when 2+ weeks are missed with no freeze available", () => {
		const before = { currentStreakWeeks: 5, longestStreakWeeks: 5, streakFreezes: 0, lastActivityAt: WEEK_0 };
		expect(computeStreakUpdate(before, WEEK_2)).toEqual({ kind: "broken" });
	});

	it("uses a freeze to cover exactly one missed week instead of breaking", () => {
		const before = { currentStreakWeeks: 5, longestStreakWeeks: 5, streakFreezes: 2, lastActivityAt: WEEK_0 };
		expect(computeStreakUpdate(before, WEEK_2)).toEqual({
			kind: "continued",
			newStreak: 6,
			newLongest: 6,
			newFreezes: 1, // one consumed
			usedFreeze: true,
		});
	});

	it("still breaks the streak when 3+ weeks are missed, even with freezes available", () => {
		// A freeze only covers a single missed week, not an arbitrarily long gap.
		const before = { currentStreakWeeks: 5, longestStreakWeeks: 5, streakFreezes: 3, lastActivityAt: WEEK_0 };
		expect(computeStreakUpdate(before, WEEK_3)).toEqual({ kind: "broken" });
	});

	it("does not go below 0 freezes and does not double-spend", () => {
		const before = { currentStreakWeeks: 1, longestStreakWeeks: 1, streakFreezes: 1, lastActivityAt: WEEK_0 };
		const result = computeStreakUpdate(before, WEEK_2);
		expect(result).toMatchObject({ usedFreeze: true, newFreezes: 0 });
	});
});

describe("updateActivityStreak", () => {
	it("starts a fresh streak at 1 for a student's first-ever activity", async () => {
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue(null);

		await updateActivityStreak("student1", "student");

		expect(prisma.studentGameProfile.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "student1" },
				create: expect.objectContaining({ currentStreakWeeks: 1, longestStreakWeeks: 1 }),
			}),
		);
	});

	it("only refreshes lastActivityAt for a second activity the same week", async () => {
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({
			currentStreakWeeks: 2,
			longestStreakWeeks: 2,
			streakFreezes: 0,
			lastActivityAt: new Date(),
		} as never);

		await updateActivityStreak("teacher1", "teacher");

		expect(prisma.teacherGameProfile.update).toHaveBeenCalledWith(
			expect.objectContaining({ where: { userId: "teacher1" } }),
		);
		const call = vi.mocked(prisma.teacherGameProfile.update).mock.calls[0][0];
		expect(Object.keys(call.data)).toEqual(["lastActivityAt"]);
	});

	it("sends a streak_saved notification only when a freeze was actually used", async () => {
		const eightWeeksAgo = new Date(Date.now() - 14 * 24 * 3_600_000);
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({
			currentStreakWeeks: 3,
			longestStreakWeeks: 3,
			streakFreezes: 1,
			lastActivityAt: eightWeeksAgo,
		} as never);

		await updateActivityStreak("student1", "student");

		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"streak_saved",
			expect.any(String),
			expect.any(String),
			expect.any(String),
		);
	});

	it("does not notify when the streak just continues normally (no freeze used)", async () => {
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3_600_000);
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({
			currentStreakWeeks: 1,
			longestStreakWeeks: 1,
			streakFreezes: 0,
			lastActivityAt: oneWeekAgo,
		} as never);

		await updateActivityStreak("student1", "student");

		expect(createNotification).not.toHaveBeenCalled();
	});

	it("does not notify at all when a streak breaks (no guilt-tripping)", async () => {
		const fiveWeeksAgo = new Date(Date.now() - 35 * 24 * 3_600_000);
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({
			currentStreakWeeks: 5,
			longestStreakWeeks: 5,
			streakFreezes: 0,
			lastActivityAt: fiveWeeksAgo,
		} as never);

		await updateActivityStreak("student1", "student");

		expect(createNotification).not.toHaveBeenCalled();
		expect(prisma.studentGameProfile.update).toHaveBeenCalledWith(
			expect.objectContaining({ data: { currentStreakWeeks: 1, lastActivityAt: expect.any(Date) } }),
		);
	});

	it("awards the streak_7 badge at a 4-week streak", async () => {
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3_600_000);
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({
			currentStreakWeeks: 3,
			longestStreakWeeks: 3,
			streakFreezes: 0,
			lastActivityAt: oneWeekAgo,
		} as never);
		vi.mocked(prisma.badge.findUnique).mockResolvedValue({ id: "b1", name: "Steady Streak" } as never);
		vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

		await updateActivityStreak("student1", "student");

		expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { key: "streak_7" } });
	});
});

describe("maybeAwardLuckyBonus", () => {
	let randomSpy: ReturnType<typeof vi.spyOn>;

	afterEach(() => {
		randomSpy.mockRestore();
	});

	it("awards gems and returns the bonus amount when the roll hits", async () => {
		randomSpy = vi.spyOn(Math, "random").mockReturnValue(0); // always below the threshold
		vi.mocked(prisma.studentGameProfile.findUnique).mockResolvedValue({ insightGems: 0 } as never);

		const bonus = await maybeAwardLuckyBonus("student1", "student");

		expect(bonus).toBeGreaterThan(0);
		expect(prisma.studentGameProfile.upsert).toHaveBeenCalled();
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"gem_received",
			expect.any(String),
			expect.any(String),
			expect.any(String),
		);
	});

	it("awards sparks for a teacher when the roll hits", async () => {
		randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 0 } as never);

		const bonus = await maybeAwardLuckyBonus("teacher1", "teacher");

		expect(bonus).toBeGreaterThan(0);
		expect(createNotification).toHaveBeenCalledWith(
			"teacher1",
			"sparks_received",
			expect.any(String),
			expect.any(String),
			expect.any(String),
		);
	});

	it("returns 0 and awards nothing when the roll misses", async () => {
		randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.999); // always above the threshold

		const bonus = await maybeAwardLuckyBonus("student1", "student");

		expect(bonus).toBe(0);
		expect(prisma.studentGameProfile.upsert).not.toHaveBeenCalled();
		expect(createNotification).not.toHaveBeenCalled();
	});
});

describe("awardSparks — engaging_educator badge", () => {
	it("awards the badge on reaching Elite Mentor rank (rank 3)", async () => {
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 3400 } as never);
		vi.mocked(prisma.badge.findUnique).mockResolvedValue({ id: "b1", name: "Engaging Educator" } as never);
		vi.mocked(prisma.userBadge.create).mockResolvedValue({} as never);

		await awardSparks("teacher1", 200); // 3400 -> 3600, crosses the 3500 rank-3 threshold

		expect(prisma.badge.findUnique).toHaveBeenCalledWith({ where: { key: "engaging_educator" } });
	});

	it("does not award the badge below Elite Mentor rank", async () => {
		vi.mocked(prisma.teacherGameProfile.findUnique).mockResolvedValue({ reputationSparks: 1000 } as never);

		await awardSparks("teacher1", 200); // still well below rank 3

		expect(prisma.badge.findUnique).not.toHaveBeenCalled();
	});
});

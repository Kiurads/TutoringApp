import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { transferPayoutForClass } from "@/app/lib/payouts";
import {
	awardGems,
	awardSparks,
	checkSessionBadges,
	updateActivityStreak,
	maybeAwardLuckyBonus,
} from "@/app/lib/gamification";
import { markCompletedClasses } from "./complete-classes";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

vi.mock("@/prisma", () => ({
	default: {
		class: {
			findMany: vi.fn(),
			updateMany: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/app/lib/payouts", () => ({ transferPayoutForClass: vi.fn() }));
vi.mock("@/app/lib/gamification", () => ({
	awardGems: vi.fn(),
	awardSparks: vi.fn(),
	checkSessionBadges: vi.fn(),
	updateActivityStreak: vi.fn(),
	maybeAwardLuckyBonus: vi.fn().mockResolvedValue(0),
}));

const pastEndedClass = {
	id: "class1",
	studentId: "student1",
	teacherId: "teacher1",
	startTime: new Date(Date.now() - 3 * 3_600_000), // started 3h ago
	durationInHours: dec(1), // ended 2h ago
	subject: { name: "Math" },
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
	vi.mocked(prisma.class.update).mockResolvedValue({} as never);
	vi.mocked(maybeAwardLuckyBonus).mockResolvedValue(0);
});

describe("markCompletedClasses", () => {
	it("skips classes that haven't ended yet", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ ...pastEndedClass, startTime: new Date(Date.now() + 3_600_000) },
		] as never);

		await markCompletedClasses();

		expect(prisma.class.updateMany).not.toHaveBeenCalled();
	});

	it("skips classes with no teacher assigned", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ ...pastEndedClass, teacherId: null },
		] as never);

		await markCompletedClasses();

		expect(prisma.class.updateMany).not.toHaveBeenCalled();
	});

	it("queries only scheduled classes with the fields it needs", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([]);

		await markCompletedClasses();

		expect(prisma.class.findMany).toHaveBeenCalledWith({
			where: { status: "scheduled" },
			select: {
				id: true,
				studentId: true,
				teacherId: true,
				startTime: true,
				durationInHours: true,
				subject: { select: { name: true } },
			},
		});
	});

	it("completes an ended class via a compare-and-swap update and triggers payout", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);

		await markCompletedClasses();

		expect(prisma.class.updateMany).toHaveBeenCalledWith({
			where: { id: "class1", status: "scheduled" },
			data: {
				status: "completed",
				gemsAwarded: { increment: 100 },
				sparksAwarded: { increment: 20 },
			},
		});
		expect(transferPayoutForClass).toHaveBeenCalledWith("class1");
	});

	// The bug this guards against: the manual "Mark Complete" action
	// (completeClass) and this poller racing on the same class. Whichever
	// wins the compare-and-swap proceeds; the other must not double-award.
	it("does not award points or trigger payout when another caller already completed the class first", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);
		vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 0 } as never);

		await markCompletedClasses();

		expect(transferPayoutForClass).not.toHaveBeenCalled();
		expect(awardGems).not.toHaveBeenCalled();
		expect(awardSparks).not.toHaveBeenCalled();
	});

	it("awards gems to the student and sparks to the teacher", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);

		await markCompletedClasses();

		expect(awardGems).toHaveBeenCalledWith("student1", 100);
		expect(awardSparks).toHaveBeenCalledWith("teacher1", 20);
	});

	it("checks session badges and updates activity streaks for both parties", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);

		await markCompletedClasses();

		expect(checkSessionBadges).toHaveBeenCalledWith("student1", "student");
		expect(checkSessionBadges).toHaveBeenCalledWith("teacher1", "teacher");
		expect(updateActivityStreak).toHaveBeenCalledWith("student1", "student");
		expect(updateActivityStreak).toHaveBeenCalledWith("teacher1", "teacher");
	});

	it("notifies both the student and the teacher, naming the subject", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);

		await markCompletedClasses();

		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"class_completed",
			"Class Completed",
			expect.stringContaining("Math"),
			"/main/student/classes/class1",
		);
		expect(createNotification).toHaveBeenCalledWith(
			"teacher1",
			"class_completed",
			"Class Completed",
			expect.stringContaining("Math"),
			"/main/teacher/classes/class1",
		);
	});

	it("applies a lucky bonus for the student on top of the base gem/spark increments", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);
		vi.mocked(maybeAwardLuckyBonus).mockImplementation(async (_id, role) =>
			role === "student" ? 25 : 0,
		);

		await markCompletedClasses();

		expect(prisma.class.update).toHaveBeenCalledWith({
			where: { id: "class1" },
			data: {
				gemsAwarded: { increment: 25 },
				sparksAwarded: { increment: 0 },
			},
		});
	});

	it("applies a lucky bonus for the teacher on top of the base gem/spark increments", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);
		vi.mocked(maybeAwardLuckyBonus).mockImplementation(async (_id, role) =>
			role === "teacher" ? 10 : 0,
		);

		await markCompletedClasses();

		expect(prisma.class.update).toHaveBeenCalledWith({
			where: { id: "class1" },
			data: {
				gemsAwarded: { increment: 0 },
				sparksAwarded: { increment: 10 },
			},
		});
	});

	it("does not issue a bonus follow-up update when neither party gets a lucky bonus", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);
		vi.mocked(maybeAwardLuckyBonus).mockResolvedValue(0);

		await markCompletedClasses();

		// updateMany claims the completion; class.update should only be called
		// for the bonus follow-up, which shouldn't happen here.
		expect(prisma.class.update).not.toHaveBeenCalled();
	});

	it("processes every ended class independently in one run", async () => {
		const second = {
			...pastEndedClass,
			id: "class2",
			studentId: "student2",
			teacherId: "teacher2",
			subject: { name: "Physics" },
		};
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass, second] as never);

		await markCompletedClasses();

		expect(prisma.class.updateMany).toHaveBeenCalledTimes(2);
		expect(transferPayoutForClass).toHaveBeenCalledWith("class1");
		expect(transferPayoutForClass).toHaveBeenCalledWith("class2");
		expect(awardGems).toHaveBeenCalledWith("student2", 100);
		expect(awardSparks).toHaveBeenCalledWith("teacher2", 20);
	});

	it("still processes the remaining classes when one in the batch has already ended and one hasn't", async () => {
		const notYetEnded = {
			...pastEndedClass,
			id: "class2",
			studentId: "student2",
			teacherId: "teacher2",
			startTime: new Date(Date.now() + 3_600_000),
		};
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass, notYetEnded] as never);

		await markCompletedClasses();

		expect(prisma.class.updateMany).toHaveBeenCalledTimes(1);
		expect(prisma.class.updateMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "class1", status: "scheduled" } }),
		);
	});

	// The bug this fix closes: an unhandled throw for one class (e.g. a
	// payout or notification failure) used to abort the whole run, leaving
	// every later already-ended class in the batch unprocessed until the
	// next poll.
	it("still completes the remaining classes when one fails unexpectedly", async () => {
		const second = {
			...pastEndedClass,
			id: "class2",
			studentId: "student2",
			teacherId: "teacher2",
			subject: { name: "Physics" },
		};
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass, second] as never);
		vi.mocked(transferPayoutForClass)
			.mockRejectedValueOnce(new Error("Stripe hiccup"))
			.mockResolvedValueOnce(undefined);

		await expect(markCompletedClasses()).resolves.not.toThrow();

		expect(prisma.class.updateMany).toHaveBeenCalledTimes(2);
		expect(awardGems).toHaveBeenCalledWith("student2", 100);
	});
});

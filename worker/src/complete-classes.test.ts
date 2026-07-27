import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { transferPayoutForClass } from "@/app/lib/payouts";
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
		const { awardGems, awardSparks } = await import("@/app/lib/gamification");
		vi.mocked(prisma.class.findMany).mockResolvedValue([pastEndedClass] as never);
		vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 0 } as never);

		await markCompletedClasses();

		expect(transferPayoutForClass).not.toHaveBeenCalled();
		expect(awardGems).not.toHaveBeenCalled();
		expect(awardSparks).not.toHaveBeenCalled();
	});
});

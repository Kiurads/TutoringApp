import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { awardGems, awardSparks, reverseClassPoints } from "./gamification";

vi.mock("@/prisma", () => ({
	default: {
		studentGameProfile: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
		teacherGameProfile: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
		class: { update: vi.fn() },
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

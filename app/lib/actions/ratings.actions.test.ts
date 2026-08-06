import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { awardGems, awardSparks, awardBadge } from "@/app/lib/gamification";
import {
	fetchRatingById,
	fetchReviewsById,
	fetchReviewByClassId,
	createReview,
} from "./ratings.actions";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

vi.mock("@/prisma", () => ({
	default: {
		teacherRating: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		user: { findUnique: vi.fn() },
		class: { findUnique: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/gamification", () => ({
	awardGems: vi.fn(),
	awardSparks: vi.fn(),
	awardBadge: vi.fn(),
}));

const mockSession = { user: { email: "student@test.com" } };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("fetchRatingById", () => {
	it("returns 0 when the teacher has no ratings", async () => {
		vi.mocked(prisma.teacherRating.findMany).mockResolvedValue([]);

		const result = await fetchRatingById("teacher1");

		expect(result).toBe(0);
	});

	it("returns the average rating", async () => {
		vi.mocked(prisma.teacherRating.findMany).mockResolvedValue([
			{ rating: dec(5) },
			{ rating: dec(3) },
		] as never);

		const result = await fetchRatingById("teacher1");

		expect(result).toBe(4);
	});

	it("returns 0 when the query throws", async () => {
		vi.mocked(prisma.teacherRating.findMany).mockRejectedValue(new Error("db down"));

		const result = await fetchRatingById("teacher1");

		expect(result).toBe(0);
	});
});

describe("fetchReviewsById", () => {
	it("returns formatted reviews ordered newest first", async () => {
		vi.mocked(prisma.teacherRating.findMany).mockResolvedValue([
			{
				id: "r1",
				studentId: "s1",
				teacherId: "t1",
				classId: "c1",
				rating: dec(4),
				review: "Great!",
				createdAt: new Date("2026-01-01"),
				student: { firstName: "Ana", lastName: "Lima" },
			},
		] as never);

		const result = await fetchReviewsById("t1");

		expect(result).toEqual([
			{
				id: "r1",
				studentId: "s1",
				studentName: "Ana Lima",
				teacherId: "t1",
				classId: "c1",
				rating: 4,
				review: "Great!",
				createdAt: new Date("2026-01-01"),
			},
		]);
	});

	it("returns an empty array when the query throws", async () => {
		vi.mocked(prisma.teacherRating.findMany).mockRejectedValue(new Error("db down"));

		const result = await fetchReviewsById("t1");

		expect(result).toEqual([]);
	});
});

describe("fetchReviewByClassId", () => {
	it("returns null when there is no session", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await fetchReviewByClassId("c1");

		expect(result).toBeNull();
	});

	it("returns null when the user is not found", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await fetchReviewByClassId("c1");

		expect(result).toBeNull();
	});

	it("returns null when no review exists for this class", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.teacherRating.findUnique).mockResolvedValue(null);

		const result = await fetchReviewByClassId("c1");

		expect(result).toBeNull();
	});

	it("returns the formatted review when one exists", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.teacherRating.findUnique).mockResolvedValue({
			id: "r1",
			studentId: "s1",
			teacherId: "t1",
			classId: "c1",
			rating: dec(5),
			review: null,
			createdAt: new Date("2026-01-01"),
			student: { firstName: "Ana", lastName: "Lima" },
		} as never);

		const result = await fetchReviewByClassId("c1");

		expect(result).toMatchObject({ id: "r1", rating: 5, studentName: "Ana Lima" });
	});
});

describe("createReview", () => {
	const completedClassRow = { studentId: "s1", status: "completed" };

	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await createReview("c1", "t1", 5, "Great!");

		expect(result).toEqual({ error: "Not authenticated." });
	});

	it("rejects a rating below 1", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);

		const result = await createReview("c1", "t1", 0, null);

		expect(result).toEqual({ error: "Rating must be between 1 and 5." });
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("rejects a rating above 5", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);

		const result = await createReview("c1", "t1", 6, null);

		expect(result).toEqual({ error: "Rating must be between 1 and 5." });
	});

	it("returns an error when the user is not found", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "User not found." });
	});

	it("returns an error when the class is not found", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null);

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "Class not found." });
	});

	it("rejects reviewing a class that isn't the caller's own", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "intruder" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "You are not the student for this class." });
		expect(prisma.teacherRating.create).not.toHaveBeenCalled();
	});

	it("rejects reviewing a class that isn't completed yet", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue({
			studentId: "s1",
			status: "scheduled",
		} as never);

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "You can only review completed classes." });
		expect(prisma.teacherRating.create).not.toHaveBeenCalled();
	});

	it("returns a friendly error when the class has already been reviewed", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockRejectedValue(
			new Error("Unique constraint failed on the fields: (`studentId`,`classId`)"),
		);

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "You have already reviewed this class." });
		expect(awardGems).not.toHaveBeenCalled();
	});

	it("returns a generic error for any other database failure", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockRejectedValue(new Error("connection reset"));

		const result = await createReview("c1", "t1", 5, null);

		expect(result).toEqual({ error: "Failed to submit review. Please try again." });
	});

	it("trims whitespace-only review text down to null", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		await createReview("c1", "t1", 3, "   ");

		expect(prisma.teacherRating.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ review: null }) }),
		);
	});

	it("always awards gems and the feedback_champion badge to the student on success", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		const result = await createReview("c1", "t1", 3, "Good");

		expect(result).toEqual({});
		expect(awardGems).toHaveBeenCalledWith("s1", 50);
		expect(awardBadge).toHaveBeenCalledWith("s1", "feedback_champion");
	});

	it("does not award sparks or a badge to the teacher for a rating below 4", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		await createReview("c1", "t1", 3, null);

		expect(awardSparks).not.toHaveBeenCalled();
		expect(awardBadge).not.toHaveBeenCalledWith("t1", "top_reviewed", expect.anything());
	});

	it("awards 75 sparks to the teacher for a 4-star rating, with no top_reviewed badge", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		await createReview("c1", "t1", 4, null);

		expect(awardSparks).toHaveBeenCalledWith("t1", 75);
		expect(awardBadge).not.toHaveBeenCalledWith("t1", "top_reviewed", expect.anything());
	});

	// The bug this fix closes: awardBadge(teacherId, "top_reviewed") was
	// called without a role, defaulting to "student" — the badge itself
	// still landed on the right user, but the earned-badge notification
	// linked to /main/student/dashboard instead of the teacher's dashboard.
	it("awards 100 sparks and the top_reviewed badge (as a teacher) for a 5-star rating", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		await createReview("c1", "t1", 5, null);

		expect(awardSparks).toHaveBeenCalledWith("t1", 100);
		expect(awardBadge).toHaveBeenCalledWith("t1", "top_reviewed", "teacher");
	});

	it("revalidates the student's class detail and teachers pages on success", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(completedClassRow as never);
		vi.mocked(prisma.teacherRating.create).mockResolvedValue({} as never);

		const { revalidatePath } = await import("next/cache");

		await createReview("c1", "t1", 5, null);

		expect(revalidatePath).toHaveBeenCalledWith("/en/main/student/classes/c1");
		expect(revalidatePath).toHaveBeenCalledWith("/pt/main/student/classes/c1");
		expect(revalidatePath).toHaveBeenCalledWith("/en/main/student/teachers");
		expect(revalidatePath).toHaveBeenCalledWith("/pt/main/student/teachers");
	});
});

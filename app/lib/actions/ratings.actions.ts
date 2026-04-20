"use server";

import prisma from "@/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Rating } from "../types/ratings.types";
import { awardGems, awardSparks, awardBadge } from "@/app/lib/gamification";

export async function fetchRatingById(id: string): Promise<number> {
	try {
		const ratings = await prisma.teacherRating.findMany({
			where: { teacherId: id },
		});

		if (ratings.length === 0) return 0;

		return (
			ratings.reduce((sum, r) => sum + r.rating.toNumber(), 0) / ratings.length
		);
	} catch {
		return 0;
	}
}

export async function fetchReviewsById(id: string): Promise<Rating[]> {
	try {
		const ratings = await prisma.teacherRating.findMany({
			where: { teacherId: id },
			include: {
				student: {
					select: { firstName: true, lastName: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return ratings.map((r) => ({
			id: r.id,
			studentId: r.studentId,
			studentName: `${r.student.firstName} ${r.student.lastName}`,
			teacherId: r.teacherId,
			classId: r.classId,
			rating: r.rating.toNumber(),
			review: r.review,
			createdAt: r.createdAt,
		}));
	} catch {
		return [];
	}
}

export async function fetchReviewByClassId(classId: string): Promise<Rating | null> {
	const session = await auth();
	if (!session?.user?.email) return null;

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true },
	});
	if (!user) return null;

	const rating = await prisma.teacherRating.findUnique({
		where: { studentId_classId: { studentId: user.id, classId } },
		include: {
			student: { select: { firstName: true, lastName: true } },
		},
	});

	if (!rating) return null;

	return {
		id: rating.id,
		studentId: rating.studentId,
		studentName: `${rating.student.firstName} ${rating.student.lastName}`,
		teacherId: rating.teacherId,
		classId: rating.classId,
		rating: rating.rating.toNumber(),
		review: rating.review,
		createdAt: rating.createdAt,
	};
}

export async function createReview(
	classId: string,
	teacherId: string,
	rating: number,
	review: string | null
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5." };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true },
	});
	if (!user) return { error: "User not found." };

	// Verify the class belongs to this student and is completed
	const cls = await prisma.class.findUnique({
		where: { id: classId },
		select: { studentId: true, status: true },
	});
	if (!cls) return { error: "Class not found." };
	if (cls.studentId !== user.id) return { error: "You are not the student for this class." };
	if (cls.status !== "completed") return { error: "You can only review completed classes." };

	try {
		await prisma.teacherRating.create({
			data: {
				studentId: user.id,
				teacherId,
				classId,
				rating,
				review: review?.trim() || null,
			},
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes("Unique constraint")) {
			return { error: "You have already reviewed this class." };
		}
		return { error: "Failed to submit review. Please try again." };
	}

	// Award gems to student for leaving a review
	await awardGems(user.id, 50);
	await awardBadge(user.id, "feedback_champion");

	// Award sparks to teacher if rating is 4+
	if (rating >= 4) {
		await awardSparks(teacherId, rating === 5 ? 100 : 75);
		if (rating === 5) await awardBadge(teacherId, "top_reviewed");
	}

	revalidatePath(`/main/student/classes/${classId}`);
	revalidatePath(`/main/student/teachers`);

	return {};
}

import prisma from "@/prisma";
import { Rating } from "../types/ratings.types";

export async function fetchRatingById(id: string): Promise<number> {
	try {
		const ratings = await prisma.teacherRating.findMany({
			where: {
				teacherId: id,
			},
		});

		if (ratings.length == 0) {
			return 0.0;
		}

		console.log(ratings[0].rating.toNumber());

		const averageRating =
			ratings.reduce((sum, rating) => sum + rating.rating.toNumber(), 0) /
			ratings.length;

		console.log(averageRating);

		return averageRating;
	} catch (error) {
		console.log(error);

		return 0.0;
	}
}

export async function fetchReviewsById(
	id: string
): Promise<Rating[] | undefined> {
	try {
		const ratings = await prisma.teacherRating.findMany({
			where: {
				teacherId: id,
			},
		});

		return ratings.map((r) => ({
			id: r.id,
			studentId: r.studentId,
			teacherId: r.teacherId,
			classId: r.classId,
			rating: r.rating.toNumber(),
			review: r.review,
			createdAt: r.createdAt,
		}));
	} catch (error) {
		console.log(error);
	}
}

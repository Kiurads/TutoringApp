import prisma from "@/prisma";

export interface Rating {
	id: string;
	studentId: string;
	teacherId: string;
	classId: string;
	rating: number;
	review: string | null;
	createdAt: Date;
}

export async function fetchRatingById(id: string) {
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

export async function fetchReviewsById(id: string) {
	try {
		const ratings = await prisma.teacherRating.findMany({
			where: {
				teacherId: id,
			},
		});

		return ratings;
	} catch (error) {
		console.log(error);
	}
}

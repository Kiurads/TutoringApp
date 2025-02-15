"use server";

import prisma from "@/prisma";

export async function fetchTeachers() {
	const teachers = await prisma.user.findMany({
		where: {
			role: "teacher",
		},
		select: {
			email: true,
			firstName: true,
			lastName: true,
			bio: true,
			pricePerHour: true, // Fetch the pricePerHour field
			teacherRatingsAsTeacher: {
				select: {
					rating: true,
				},
			},
		},
	});

	// Calculate the average rating and format pricePerHour as a string
	const teachersWithRatingAndPrice = teachers.map((teacher) => {
		const ratings = teacher.teacherRatingsAsTeacher.map((r) => r.rating);
		const ratingAverage =
			ratings.length > 0
				? ratings.reduce((sum, rating) => sum + rating, 0) /
				  ratings.length
				: null;

		// Format pricePerHour as a string (e.g., "50.00")
		const pricePerHour = teacher.pricePerHour
			? teacher.pricePerHour.toFixed(2) // Ensure 2 decimal places
			: "0.00"; // Default value if pricePerHour is null or undefined

		return {
			...teacher,
			ratingAverage,
			pricePerHour, // Add formatted pricePerHour as a string
		};
	});

	console.log(teachersWithRatingAndPrice);

	return teachersWithRatingAndPrice;
}

export async function fetchTeachersBySubjectsId(subjects?: string[]) {
	const teachers = await prisma.user.findMany({
		where: {
			teacherSubject: {
				some: {
					subject: {
						id: {
							in: subjects,
						},
					},
				},
			},
			role: "teacher",
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
		},
	});

	return teachers;
}

"use server";

import prisma from "@/prisma";
import UserDetails from "../types/user.types";
import { TeacherDetails, TeacherExtended } from "../types/teachers.types";

export async function fetchTeachers(): Promise<TeacherDetails[]> {
	const teachers = await prisma.user.findMany({
		where: {
			role: "teacher",
		},
		select: {
			id: true,
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
				? ratings.reduce((sum, rating) => sum + rating.toNumber(), 0) /
				  ratings.length
				: null;

		const pricePerHour = teacher.pricePerHour
			? teacher.pricePerHour.toFixed(2)
			: "0.00";

		return {
			id: teacher.id,
			name: `${teacher.firstName} ${teacher.lastName}`,
			email: teacher.email,
			bio: teacher.bio,
			rating:
				ratingAverage !== null
					? ratingAverage.toFixed(2)
					: "No Reviews", // Format rating
			pricePerHour: pricePerHour, // Use the formatted pricePerHour
		};
	});

	return teachersWithRatingAndPrice;
}

export async function fetchTeachersExtended(): Promise<TeacherExtended[]> {
	const teachers = await prisma.user.findMany({
		where: {
			role: "teacher",
		},
		select: {
			id: true,
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
			teacherSubject: {
				select: {
					subject: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});

	// Calculate the average rating and format pricePerHour as a string
	const teachersWithRatingAndPrice = teachers.map((teacher) => {
		const ratings = teacher.teacherRatingsAsTeacher.map((r) => r.rating);
		const ratingAverage =
			ratings.length > 0
				? ratings.reduce((sum, rating) => sum + rating.toNumber(), 0) /
				  ratings.length
				: null;

		const pricePerHour = teacher.pricePerHour
			? teacher.pricePerHour.toFixed(2)
			: "0.00";

		return {
			id: teacher.id,
			name: `${teacher.firstName} ${teacher.lastName}`,
			email: teacher.email,
			bio: teacher.bio,
			rating:
				ratingAverage !== null
					? ratingAverage.toFixed(2)
					: "No Reviews", // Format rating
			pricePerHour: pricePerHour, // Use the formatted pricePerHour
			subjects: teacher.teacherSubject.map((ts) => ts.subject.name),
			status: "Active" as "Active", // Placeholder, adjust as needed
		};
	});

	return teachersWithRatingAndPrice;
}

export async function fetchTeachersBySubjectsId(
	subjects?: string[]
): Promise<UserDetails[]> {
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
			email: true,
		},
	});

	return teachers.map((teacher) => ({
		id: teacher.id,
		name: `${teacher.firstName} ${teacher.lastName}`,
		email: teacher.email,
		role: "teacher",
	}));
}

export async function fetchTeacherById(id: string): Promise<UserDetails> {
	const teacher = await prisma.user.findUnique({
		where: {
			id: id,
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
		},
	});

	if (!teacher) throw new Error("Teacher not found");

	return {
		id: teacher.id,
		name: `${teacher.firstName} ${teacher.lastName}`,
		email: teacher.email,
		role: "teacher",
	};
}

"use server";

import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import UserDetails from "../types/user.types";
import { TeacherDetails, TeacherExtended } from "../types/teachers.types";
import { isWithinAvailability } from "../availability/check-availability";

export type TeacherBookingOption = TeacherDetails & { isAvailable: boolean };

export async function fetchTeachersForBooking(
	subjectId: string,
	startTime: string,
	durationInHours: number,
): Promise<TeacherBookingOption[]> {
	const start = new Date(startTime);

	const teachers = await prisma.user.findMany({
		where: {
			role: "teacher",
			teacherSubject: { some: { subject: { id: subjectId } } },
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			bio: true,
			isOnline: true,
			pricePerHour: true,
			teacherRatingsAsTeacher: { select: { rating: true } },
			teacherAvailability: {
				select: { dayOfWeek: true, startHour: true, startMin: true },
			},
		},
	});

	const result: TeacherBookingOption[] = teachers.map((t) => {
		const ratings = t.teacherRatingsAsTeacher.map((r) => r.rating);
		const avg = ratings.length > 0
			? ratings.reduce((s, r) => s + r.toNumber(), 0) / ratings.length
			: null;

		return {
			id: t.id,
			name: `${t.firstName} ${t.lastName}`,
			email: t.email,
			bio: t.bio,
			isOnline: t.isOnline,
			rating: avg !== null ? avg.toFixed(2) : "No Reviews",
			pricePerHour: t.pricePerHour ? t.pricePerHour.toFixed(2) : "0.00",
			isAvailable: isWithinAvailability(t.teacherAvailability, start, durationInHours),
		};
	});

	// Available first → online first → alphabetical
	return result.sort((a, b) => {
		if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
		if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}

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
			isOnline: true,
			pricePerHour: true,
			teacherRatingsAsTeacher: {
				select: {
					rating: true,
				},
			},
		},
	});

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
			isOnline: teacher.isOnline,
			rating:
				ratingAverage !== null
					? ratingAverage.toFixed(2)
					: "No Reviews",
			pricePerHour: pricePerHour,
		};
	});

	// Online teachers appear first
	return teachersWithRatingAndPrice.sort((a, b) =>
		a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1
	);
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
			isOnline: true,
			pricePerHour: true,
			teacherRatingsAsTeacher: {
				select: { rating: true },
			},
			teacherSubject: {
				select: {
					subject: {
						select: { id: true, name: true },
					},
				},
			},
			teacherAvailability: {
				select: { dayOfWeek: true },
			},
		},
	});

	return teachers.map((teacher) => {
		const ratings = teacher.teacherRatingsAsTeacher.map((r) => r.rating);
		const ratingAverage =
			ratings.length > 0
				? ratings.reduce((sum, r) => sum + r.toNumber(), 0) / ratings.length
				: null;

		return {
			id: teacher.id,
			name: `${teacher.firstName} ${teacher.lastName}`,
			email: teacher.email,
			bio: teacher.bio,
			isOnline: teacher.isOnline,
			rating: ratingAverage !== null ? ratingAverage.toFixed(2) : "No Reviews",
			pricePerHour: teacher.pricePerHour ? teacher.pricePerHour.toFixed(2) : "0.00",
			subjects: teacher.teacherSubject.map((ts) => ts.subject.name),
			subjectIds: teacher.teacherSubject.map((ts) => ts.subject.id),
			availabilityDays: [...new Set(teacher.teacherAvailability.map((a) => a.dayOfWeek))],
			status: "Active" as const,
		};
	});
}

export async function fetchTeachersBySubjectsId(
	subjects?: string[]
): Promise<TeacherDetails[]> {
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
			bio: true,
			isOnline: true,
			pricePerHour: true,
			teacherRatingsAsTeacher: {
				select: { rating: true },
			},
		},
	});

	return teachers.map((teacher) => {
		const ratings = teacher.teacherRatingsAsTeacher.map((r) => r.rating);
		const ratingAverage =
			ratings.length > 0
				? ratings.reduce((sum, r) => sum + r.toNumber(), 0) / ratings.length
				: null;

		return {
			id: teacher.id,
			name: `${teacher.firstName} ${teacher.lastName}`,
			email: teacher.email,
			bio: teacher.bio,
			isOnline: teacher.isOnline,
			rating: ratingAverage !== null ? ratingAverage.toFixed(2) : "No Reviews",
			pricePerHour: teacher.pricePerHour
				? teacher.pricePerHour.toFixed(2)
				: "0.00",
		};
	});
}

export async function getTeacherOnlineStatus(email: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { isOnline: true },
	});
	return user?.isOnline ?? false;
}

export async function toggleTeacherOnline(email: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { isOnline: true },
	});
	if (!user) throw new Error("User not found");

	const updated = await prisma.user.update({
		where: { email },
		data: { isOnline: !user.isOnline },
		select: { isOnline: true },
	});

	revalidatePath("/main/teacher");
	return updated.isOnline;
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

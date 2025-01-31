import prisma from "@/prisma";
import { User } from "@prisma/client";

export async function fetchClassesByUser(user: User) {
	if (user.role === "student") {
		return await prisma.class.findMany({
			where: {
				student: {
					id: user.id,
				},
			},
		});
	} else {
		return await prisma.class.findMany({
			where: {
				teacher: {
					id: user.id,
				},
			},
		});
	}
}

export async function fetchUpcomingClassesByUser(userEmail: string) {
	const classes = await prisma.class.findMany({
		where: {
			startTime: {
				gt: new Date(),
			},
			OR: [
				{
					student: {
						email: userEmail,
					},
				},
				{
					teacher: {
						user: {
							email: userEmail,
						},
					},
				},
			],
		},
		include: {
			teacher: {
				include: {
					user: true,
				},
			},
			subject: true,
		},
	});

	return classes;
}

export async function fetchBookedClassesByUser(userEmail: string) {
	return await prisma.class.findMany({
		where: {
			OR: [
				{
					student: {
						email: userEmail,
					},
				},
				{
					teacher: {
						user: {
							email: userEmail,
						},
					},
				},
			],
		},
		include: {
			teacher: {
				include: {
					user: true,
				},
			},
			subject: true,
		},
	});
}

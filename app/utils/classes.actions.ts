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
	return await prisma.class.findMany({
		where: {
			startTime: {
				lt: new Date(),
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
	});
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
	});
}

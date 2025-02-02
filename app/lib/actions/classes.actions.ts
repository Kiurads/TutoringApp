"use server";

import prisma from "@/prisma";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function fetchClassById(id: string) {
	return await prisma.class.findFirst({
		where: {
			id: id,
		},
		select: {
			teacher: {
				select: {
					user: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
				},
			},
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			subject: {
				select: {
					name: true,
				},
			},
		},
	});
}

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

export async function cancelClassById(classId: string) {
	await prisma.class.delete({
		where: {
			id: classId,
		},
	});

	revalidatePath("/main/classes");
	redirect("/main/classes");
}

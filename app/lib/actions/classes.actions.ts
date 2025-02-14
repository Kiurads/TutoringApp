"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchUserByEmail } from "./users.actions";

export async function fetchClassById(id: string) {
	return await prisma.class.findFirst({
		where: {
			id: id,
		},
		select: {
			teacher: {
				select: {
					firstName: true,
					lastName: true,
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
			requester: {
				select: {
					id: true,
				},
			},
		},
	});
}

export async function fetchClassesByUser(user: User) {
	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{ studentId: user.id }, // Classes where the user is the student
				{ teacherId: user.id }, // Classes where the user is the requester
			],
		},
		orderBy: {
			startTime: "desc", // Sort by startTime in descending order (most recent first)
		},
	});

	return classes;
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
						email: userEmail,
					},
				},
			],
		},
		include: {
			teacher: true,
			subject: true,
		},
		orderBy: {
			startTime: "desc",
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
						email: userEmail,
					},
				},
			],
		},
		select: {
			id: true,
			durationInHours: true,
			startTime: true,
			totalPrice: true,
			status: true,
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			teacher: {
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

export async function fetchClassRequestedBySelf(classId: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);
	const classRequested = await fetchClassById(classId);

	return classRequested?.requester.id == user?.id;
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

export async function acceptClassById(classId: string) {
	await prisma.class.update({
		where: {
			id: classId,
		},
		data: {
			status: "scheduled",
		},
	});

	revalidatePath("/main/classes");
	redirect("/main/classes");
}

export async function refuseClassById(classId: string) {
	await prisma.class.update({
		where: {
			id: classId,
		},
		data: {
			status: "refused",
		},
	});

	revalidatePath("/main/classes");
	redirect("/main/classes");
}

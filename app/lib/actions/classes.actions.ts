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
			requester: {
				select: {
					id: true,
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

"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchUserByEmail } from "./users.actions";
import { decimalToHours } from "@/utils/decimal-to-time";
import { Decimal } from "@prisma/client/runtime/library";
import { ClassData, ClassDataSimple } from "../types/classes.types";
import { formatUser } from "../types/user.types";

export interface ClassDataCalendar {
	subject: string;
	teacherName: string;
	studentName: string;
	day: string;
	startTime: string;
	duration: Decimal;
	status: string;
}

export async function fetchClassById(id: string): Promise<ClassData | null> {
	const classData = await prisma.class.findFirst({
		where: {
			id: id,
		},
		include: {
			teacher: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
				},
			},
			student: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
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

	if (!classData) return null;

	return {
		id: classData.id,
		teacher: formatUser(classData.teacher),
		student: formatUser(classData.student),
		status: classData.status,
		subject: classData.subject.name,
		requesterId: classData.requester.id,
		startTime: classData.startTime.toISOString(),
		durationInHours: classData.durationInHours.toString(),
		paid: classData.paid,
		totalPrice: classData.totalPrice.toString(),
		createdAt: classData.createdAt.toISOString(),
	};
}

export async function fetchClassesByUser(
	user: User
): Promise<ClassDataSimple[]> {
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

	return classes.map((c) => ({
		id: c.id,
		status: c.status,
		startTime: c.startTime.toISOString(),
		durationInHours: c.durationInHours.toString(),
		paid: c.paid,
		totalPrice: c.totalPrice.toString(),
		createdAt: c.createdAt.toISOString(),
	}));
}

export async function fetchUpcomingClassesByUser(
	userEmail: string
): Promise<ClassData[]> {
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
			student: true,
			teacher: true,
			subject: true,
		},
		orderBy: {
			startTime: "desc",
		},
	});

	return classes.map((c) => ({
		id: c.id,
		teacher: formatUser(c.teacher),
		student: formatUser(c.student),
		status: c.status,
		subject: c.subject.name,
		requesterId: c.requesterId,
		startTime: c.startTime.toISOString(),
		durationInHours: c.durationInHours.toString(),
		paid: c.paid,
		totalPrice: c.totalPrice.toString(),
		createdAt: c.createdAt.toISOString(),
	}));
}

export async function fetchBookedClassesByUser(userEmail: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);

	const classes = await prisma.class.findMany({
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
		orderBy: {
			startTime: "desc",
		},
		select: {
			id: true,
			durationInHours: true,
			startTime: true,
			totalPrice: true,
			status: true,
			paid: true,
			student: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			requester: {
				select: {
					id: true,
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

	return classes.map((c) => ({
		id: c.id,
		durationInHours: decimalToHours(c.durationInHours),
		startTime: c.startTime,
		totalPrice: c.totalPrice.toString(),
		status: c.status,
		paid: c.paid,
		requestedBySelf: c.requester.id == user?.id,
		student: {
			name: c.student.firstName + " " + c.student.lastName,
		},
		teacher: {
			name: c.teacher.firstName + " " + c.teacher.lastName,
		},
		subject: {
			name: c.subject.name,
		},
	}));
}

export async function fetchClassRequestedBySelf(classId: string) {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);
	const classRequested = await fetchClassById(classId);

	return classRequested?.requesterId == user?.id;
}

export async function fetchClassSubjectsBySelf() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return false;
	}

	const user = await fetchUserByEmail(session.user.email);
	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{
					studentId: user?.id,
				},
				{
					teacherId: user?.id,
				},
			],
		},
		select: {
			subject: {
				select: {
					name: true,
				},
			},
		},
	});

	return classes.map((c) => ({
		subjectName: c.subject.name,
	}));
}

export async function fetchClassBySelfCalendar(): Promise<
	ClassDataCalendar[] | null
> {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return null;
	}

	const user = await fetchUserByEmail(session.user.email);

	const classes = await prisma.class.findMany({
		where: {
			OR: [
				{
					studentId: user?.id,
				},
				{
					teacherId: user?.id,
				},
			],
		},
		select: {
			subject: {
				select: {
					name: true,
				},
			},
			startTime: true,
			durationInHours: true,
			status: true,
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
		},
	});

	return classes.map((c) => ({
		subject: c.subject.name,
		teacherName: `${c.teacher.firstName} ${c.teacher.lastName}`,
		studentName: `${c.student.firstName} ${c.student.lastName}`,
		day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
			c.startTime
		),
		startTime: c.startTime.toISOString().split("T")[1].slice(0, 5),
		duration: c.durationInHours,
		status: c.status,
	}));
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

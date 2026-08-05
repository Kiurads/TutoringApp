"use server";

import prisma from "@/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface AvailabilitySlot {
	dayOfWeek: number; // 0=Sun … 6=Sat
	startHour: number;
	startMin: number; // 0 or 30
	endHour: number;
	endMin: number;
}

export async function fetchAvailability(
	teacherId: string,
): Promise<AvailabilitySlot[]> {
	const rows = await prisma.teacherAvailability.findMany({
		where: { teacherId },
		orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }, { startMin: "asc" }],
	});
	return rows.map((r) => ({
		dayOfWeek: r.dayOfWeek,
		startHour: r.startHour,
		startMin: r.startMin,
		endHour: r.endHour,
		endMin: r.endMin,
	}));
}

function isValidTimezone(tz: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

export async function setAvailability(
	slots: AvailabilitySlot[],
	timezone?: string,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const teacher = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true, role: true },
	});
	if (!teacher || teacher.role !== "teacher")
		return { error: "Not authorized." };

	if (timezone !== undefined && !isValidTimezone(timezone)) {
		return { error: "That doesn't look like a valid timezone." };
	}

	await prisma.$transaction([
		prisma.teacherAvailability.deleteMany({ where: { teacherId: teacher.id } }),
		prisma.teacherAvailability.createMany({
			data: slots.map((s) => ({ teacherId: teacher.id, ...s })),
		}),
		...(timezone !== undefined
			? [prisma.user.update({ where: { id: teacher.id }, data: { timezone } })]
			: []),
	]);

	revalidatePath("/main/teacher/availability");
	return {};
}

"use server";

import prisma from "@/prisma";
import { revalidatePath } from "next/cache";

export interface NotificationData {
	id: string;
	type: string;
	title: string;
	body: string;
	link: string | null;
	read: boolean;
	createdAt: string;
}

export async function fetchNotificationsForUser(
	email: string,
): Promise<NotificationData[]> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (!user) return [];

	const notifications = await prisma.notification.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
		take: 30,
	});

	return notifications.map((n) => ({
		id: n.id,
		type: n.type,
		title: n.title,
		body: n.body,
		link: n.link,
		read: n.read,
		createdAt: n.createdAt.toISOString(),
	}));
}

export async function markNotificationRead(notificationId: string) {
	await prisma.notification.update({
		where: { id: notificationId },
		data: { read: true },
	});
	revalidatePath("/main/student", "layout");
	revalidatePath("/main/teacher", "layout");
}

export async function markAllNotificationsRead(email: string) {
	const user = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (!user) return;

	await prisma.notification.updateMany({
		where: { userId: user.id, read: false },
		data: { read: true },
	});
	revalidatePath("/main/student", "layout");
	revalidatePath("/main/teacher", "layout");
}

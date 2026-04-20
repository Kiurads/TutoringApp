import prisma from "@/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(
	userId: string,
	type: NotificationType,
	title: string,
	body: string,
	link?: string,
) {
	await prisma.notification.create({
		data: { userId, type, title, body, link: link ?? null },
	});
}

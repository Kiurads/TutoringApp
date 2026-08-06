"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import revalidatePath from "@/app/utils/revalidate-localized-path";
import { fetchUserByEmail } from "./users.actions";
import { createNotification } from "@/app/lib/notifications";

const MAX_MESSAGE_LENGTH = 2000;

export interface MessageData {
	id: string;
	senderId: string;
	senderName: string;
	body: string;
	createdAt: string;
}

interface ClassParticipants {
	studentId: string;
	teacherId: string | null;
	student: { firstName: string; lastName: string };
	teacher: { firstName: string; lastName: string } | null;
}

// Messaging is scoped to a specific Class (booking) rather than a general
// inbox — only the student, the assigned teacher, or an admin may read or
// send on a given class's thread, and only once a teacher is actually
// assigned (nobody to message before that). Returns null for anything that
// doesn't resolve to a real, viewable thread — not found, no teacher yet, or
// viewer isn't a participant — so callers render all of those as "no thread"
// rather than distinguishing them.
async function resolveParticipant(
	classId: string,
): Promise<{ classData: ClassParticipants; viewerId: string; viewerRole: string } | null> {
	const session = await auth();
	if (!session?.user?.email) return null;

	const viewer = await fetchUserByEmail(session.user.email);
	if (!viewer) return null;

	const classData = await prisma.class.findUnique({
		where: { id: classId },
		select: {
			studentId: true,
			teacherId: true,
			student: { select: { firstName: true, lastName: true } },
			teacher: { select: { firstName: true, lastName: true } },
		},
	});
	if (!classData || !classData.teacherId) return null;

	const isParticipant =
		viewer.role === "admin" ||
		viewer.id === classData.studentId ||
		viewer.id === classData.teacherId;
	if (!isParticipant) return null;

	return { classData, viewerId: viewer.id, viewerRole: viewer.role };
}

export async function fetchMessagesForClass(classId: string): Promise<MessageData[]> {
	const resolved = await resolveParticipant(classId);
	if (!resolved) return [];

	const messages = await prisma.message.findMany({
		where: { classId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			senderId: true,
			body: true,
			createdAt: true,
			sender: { select: { firstName: true, lastName: true } },
		},
	});

	return messages.map((m) => ({
		id: m.id,
		senderId: m.senderId,
		senderName: `${m.sender.firstName} ${m.sender.lastName}`,
		body: m.body,
		createdAt: m.createdAt.toISOString(),
	}));
}

export async function sendMessage(classId: string, body: string): Promise<{ error?: string }> {
	const resolved = await resolveParticipant(classId);
	if (!resolved) return { error: "You can't message on this class." };

	const trimmed = body.trim();
	if (!trimmed) return { error: "Message can't be empty." };
	if (trimmed.length > MAX_MESSAGE_LENGTH) {
		return { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` };
	}

	const { classData, viewerId } = resolved;

	await prisma.message.create({
		data: { classId, senderId: viewerId, body: trimmed },
	});

	// Notify whichever side of the pairing didn't just send this — admins
	// viewing a thread don't get notified, there's no "the other admin".
	const senderName =
		viewerId === classData.studentId
			? `${classData.student.firstName}`
			: classData.teacher
				? `${classData.teacher.firstName}`
				: "Someone";

	if (viewerId === classData.studentId && classData.teacherId) {
		await createNotification(
			classData.teacherId,
			"message_received",
			"New Message",
			`${senderName} sent you a message about an upcoming class.`,
			`/main/teacher/classes/${classId}`,
		);
	} else if (viewerId === classData.teacherId) {
		await createNotification(
			classData.studentId,
			"message_received",
			"New Message",
			`${senderName} sent you a message about an upcoming class.`,
			`/main/student/classes/${classId}`,
		);
	}

	revalidatePath(`/main/student/classes/${classId}`);
	revalidatePath(`/main/teacher/classes/${classId}`);

	return {};
}

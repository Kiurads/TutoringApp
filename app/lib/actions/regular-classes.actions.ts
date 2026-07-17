"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { fetchUserByEmail } from "./users.actions";
import { cancelClassCore } from "./classes.actions";
import { materializeOccurrences } from "@/app/lib/regular-classes/materialize-occurrences";
import { formatUser } from "../types/user.types";
import { RegularClassData } from "../types/regular-classes.types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatRegularClass(rc: {
	id: string;
	status: string;
	dayOfWeek: number;
	startTime: Date;
	durationInHours: { toString: () => string };
	totalPrice: { toString: () => string };
	createdAt: Date;
	subject: { name: string };
	student: { id: string; firstName: string; lastName: string; email: string; role: string };
	teacher: { id: string; firstName: string; lastName: string; email: string; role: string };
}): RegularClassData {
	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		id: rc.id,
		status: rc.status,
		dayOfWeek: rc.dayOfWeek,
		startTime: `${pad(rc.startTime.getHours())}:${pad(rc.startTime.getMinutes())}`,
		durationInHours: rc.durationInHours.toString(),
		totalPrice: rc.totalPrice.toString(),
		subject: rc.subject.name,
		student: formatUser(rc.student),
		teacher: formatUser(rc.teacher),
		createdAt: rc.createdAt.toISOString(),
	};
}

export async function requestRegularClass(
	_prevState: string | undefined,
	formData: FormData,
) {
	const session = await auth();
	if (!session?.user?.email) {
		return "You must be logged in to request a recurring class.";
	}

	const subjectId = formData.get("subject") as string;
	const teacherId = formData.get("teacher") as string;
	const dayOfWeekRaw = formData.get("dayOfWeek") as string;
	const time = formData.get("time") as string;
	const duration = formData.get("duration") as string;

	if (!subjectId) return "Please select a subject.";
	if (!teacherId) return "Please select a teacher.";
	if (!dayOfWeekRaw) return "Please select a day of the week.";
	if (!time) return "Please select a time.";
	if (!duration) return "Please select a duration.";

	const dayOfWeek = parseInt(dayOfWeekRaw, 10);
	if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
		return "Invalid day of week.";
	}

	const [hourStr, minuteStr] = time.split(":");
	const hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);
	if (Number.isNaN(hour) || Number.isNaN(minute)) return "Invalid time.";

	const durationInHours = parseFloat(duration);
	if (Number.isNaN(durationInHours) || durationInHours <= 0) {
		return "Invalid duration.";
	}

	const student = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true },
	});
	if (!student) return "Student not found.";

	const teacher = await prisma.user.findUnique({
		where: { id: teacherId },
		select: { pricePerHour: true, firstName: true, lastName: true },
	});
	if (!teacher || !teacher.pricePerHour) return "Teacher not found.";

	const subject = await prisma.subject.findUnique({
		where: { id: subjectId },
		select: { name: true },
	});

	const totalPrice = Number(teacher.pricePerHour) * durationInHours;

	const startTime = new Date();
	startTime.setHours(hour, minute, 0, 0);

	const regularClass = await prisma.regularClass.create({
		data: {
			studentId: student.id,
			teacherId,
			subjectId,
			dayOfWeek,
			startTime,
			durationInHours,
			totalPrice,
			status: "requested",
		},
	});

	await createNotification(
		teacherId,
		"regular_class_requested",
		"New Recurring Class Request",
		`A student is requesting a weekly ${subject?.name ?? "class"} every ${DAY_NAMES[dayOfWeek]} at ${time}.`,
		`/main/teacher/regular-classes/${regularClass.id}`,
	);

	redirect("/main/student/regular-classes?toast=created");
}

export async function acceptRegularClass(id: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.email) return;
	const user = await fetchUserByEmail(session.user.email);

	const rc = await prisma.regularClass.findUnique({ where: { id } });
	if (!rc) return;
	if (user?.role !== "admin" && user?.id !== rc.teacherId) return;
	if (rc.status !== "requested") return;

	await prisma.regularClass.update({ where: { id }, data: { status: "active" } });
	await materializeOccurrences(id);

	await createNotification(
		rc.studentId,
		"regular_class_accepted",
		"Recurring Class Accepted",
		`Your weekly recurring class request every ${DAY_NAMES[rc.dayOfWeek]} was accepted.`,
		`/main/student/regular-classes`,
	);

	revalidatePath("/main/teacher/regular-classes");
	redirect("/main/teacher/regular-classes?toast=accepted");
}

export async function refuseRegularClass(id: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.email) return;
	const user = await fetchUserByEmail(session.user.email);

	const rc = await prisma.regularClass.findUnique({ where: { id } });
	if (!rc) return;
	if (user?.role !== "admin" && user?.id !== rc.teacherId) return;
	if (rc.status !== "requested") return;

	await prisma.regularClass.update({ where: { id }, data: { status: "inactive" } });

	await createNotification(
		rc.studentId,
		"regular_class_refused",
		"Recurring Class Refused",
		`Your weekly recurring class request every ${DAY_NAMES[rc.dayOfWeek]} was declined.`,
		`/main/student/regular-classes`,
	);

	revalidatePath("/main/teacher/regular-classes");
	redirect("/main/teacher/regular-classes?toast=refused");
}

export async function cancelRegularClass(id: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.email) return;
	const user = await fetchUserByEmail(session.user.email);

	const rc = await prisma.regularClass.findUnique({ where: { id } });
	if (!rc) return;

	const isParticipant =
		user?.role === "admin" || user?.id === rc.studentId || user?.id === rc.teacherId;
	if (!isParticipant) return;

	await prisma.regularClass.update({ where: { id }, data: { status: "inactive" } });

	// Cancel future non-terminal occurrences, reusing the existing refund-tier
	// logic — history (completed/past/already-refused occurrences) is left
	// untouched since this query only ever targets future rows.
	const futureOccurrences = await prisma.class.findMany({
		where: {
			regularClassId: id,
			startTime: { gt: new Date() },
			status: { in: ["requested", "scheduled"] },
		},
		select: { id: true },
	});

	for (const occurrence of futureOccurrences) {
		await cancelClassCore(occurrence.id, user);
	}

	const isTeacher = user?.id === rc.teacherId;
	const counterpartId = isTeacher ? rc.studentId : rc.teacherId;
	await createNotification(
		counterpartId,
		"regular_class_cancelled",
		"Recurring Class Cancelled",
		`The weekly recurring class every ${DAY_NAMES[rc.dayOfWeek]} has been cancelled.`,
		isTeacher ? "/main/student/regular-classes" : "/main/teacher/regular-classes",
	);

	const path = isTeacher ? "/main/teacher/regular-classes" : "/main/student/regular-classes";
	revalidatePath(path);
	redirect(`${path}?toast=cancelled`);
}

export async function fetchRegularClassesByStudent(email: string): Promise<RegularClassData[]> {
	const student = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	if (!student) return [];

	const rows = await prisma.regularClass.findMany({
		where: { studentId: student.id },
		include: { subject: true, student: true, teacher: true },
		orderBy: { createdAt: "desc" },
	});

	return rows.map(formatRegularClass);
}

export async function fetchRegularClassesByTeacher(email: string): Promise<RegularClassData[]> {
	const teacher = await prisma.user.findUnique({ where: { email }, select: { id: true } });
	if (!teacher) return [];

	const rows = await prisma.regularClass.findMany({
		where: { teacherId: teacher.id },
		include: { subject: true, student: true, teacher: true },
		orderBy: { createdAt: "desc" },
	});

	return rows.map(formatRegularClass);
}

export async function fetchRegularClassById(id: string): Promise<RegularClassData | null> {
	const rc = await prisma.regularClass.findUnique({
		where: { id },
		include: { subject: true, student: true, teacher: true },
	});
	if (!rc) return null;
	return formatRegularClass(rc);
}

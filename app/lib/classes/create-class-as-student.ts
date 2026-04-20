"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { isWithinAvailability } from "@/app/lib/availability/check-availability";

export async function createClassAsStudent(
	_prevState: string | undefined,
	formData: FormData,
) {
	const session = await auth();
	if (!session || !session.user || !session.user.email) {
		return "You must be logged in to create a class.";
	}

	const subjectId = formData.get("subject") as string;
	const teacherId = (formData.get("teacher") as string) || null;
	const startTime = formData.get("startTime") as string;
	const duration = formData.get("duration") as string;

	if (!subjectId) return "Please select a subject.";
	if (!startTime) return "Please select a start time.";
	if (!duration) return "Please select a duration.";

	const classStartTime = new Date(startTime);
	const tomorrow = new Date();
	tomorrow.setHours(0, 0, 0, 0);
	tomorrow.setDate(tomorrow.getDate() + 1);

	if (classStartTime < tomorrow) {
		return "Start time must be from tomorrow onward.";
	}

	const student = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			studentGameProfile: { select: { priorityBooking: true } },
		},
	});

	if (!student) return "Student not found.";

	const priorityBooking = student.studentGameProfile?.priorityBooking ?? false;

	const durationInHours = parseFloat(duration);

	if (teacherId) {
		// Specific teacher mode — calculate price now
		const teacher = await prisma.user.findUnique({
			where: { id: teacherId },
			select: { pricePerHour: true, firstName: true, lastName: true },
		});

		if (!teacher || !teacher.pricePerHour) return "Teacher not found.";

		const availabilitySlots = await prisma.teacherAvailability.findMany({
			where: { teacherId },
			select: { dayOfWeek: true, startHour: true, startMin: true },
		});
		if (!isWithinAvailability(availabilitySlots, classStartTime, durationInHours)) {
			return "The teacher is not available at the selected time. Please choose a slot within their available hours.";
		}

		const totalPrice = Number(teacher.pricePerHour) * durationInHours;

		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
			select: { name: true },
		});

		const newClass = await prisma.class.create({
			data: {
				studentId: student.id,
				teacherId,
				subjectId,
				startTime: classStartTime,
				durationInHours,
				totalPrice,
				status: "requested",
				requesterId: student.id,
			},
		});

		// Notify teacher of the new request
		const studentRecord = await prisma.user.findUnique({
			where: { id: student.id },
			select: { firstName: true, lastName: true },
		});
		if (studentRecord) {
			await createNotification(
				teacherId,
				"class_requested",
				"New Class Request",
				`${studentRecord.firstName} ${studentRecord.lastName} is requesting a ${subject?.name ?? "class"} on ${classStartTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
				`/main/teacher/classes/${newClass.id}`,
			);
		}
	} else {
		// On-demand broadcast mode — check that at least one online teacher covers the subject
		const availableTeachers = await prisma.user.findMany({
			where: {
				role: "teacher",
				isOnline: true,
				teacherSubject: { some: { subjectId } },
			},
			select: { id: true },
		});

		if (availableTeachers.length === 0) {
			return "No teachers are currently available for this subject. Try again later or schedule with a specific teacher.";
		}

		// Broadcast: no teacher assigned yet, price set when teacher claims
		await prisma.class.create({
			data: {
				studentId: student.id,
				teacherId: null,
				subjectId,
				startTime: classStartTime,
				durationInHours,
				totalPrice: 0,
				status: "requested",
				requesterId: student.id,
				priority: priorityBooking,
			},
		});

		// Consume Priority Booking token
		if (priorityBooking) {
			await prisma.studentGameProfile.update({
				where: { userId: student.id },
				data: { priorityBooking: false },
			});
		}
	}

	redirect("/main/student/classes?toast=created");
}

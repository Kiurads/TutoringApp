import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Create teacher data
	const teacher = await prisma.teacher.create({
		data: {
			userId: "cm5vixln20002xra438tsi5ih",
			pricePerHour: 30.5,
		},
	});

	// Create subjects
	const mathSubject = await prisma.subject.create({
		data: {
			name: "Mathematics",
		},
	});

	const englishSubject = await prisma.subject.create({
		data: {
			name: "English",
		},
	});

	// Assign subjects to teacher
	await prisma.teacherSubject.create({
		data: {
			teacherId: teacher.id,
			subjectId: mathSubject.id,
		},
	});

	// Create classes
	const class1 = await prisma.class.create({
		data: {
			studentId: "cm5vix1bd0001xra4u7eda81v",
			teacherId: "cm5vixln20002xra438tsi5ih",
			subjectId: mathSubject.id,
			startTime: new Date("2025-02-01T10:00:00Z"),
			durationInHours: 1.5,
			totalPrice: 45.75,
			status: "scheduled",
			requestedBy: "student",
		},
	});

	// Create regular classes
	await prisma.regularClass.create({
		data: {
			studentId: "cm5vix1bd0001xra4u7eda81v",
			teacherId: "cm5vixln20002xra438tsi5ih",
			subjectId: englishSubject.id,
			dayOfWeek: 2, // Tuesday
			startTime: new Date("2025-02-01T14:00:00Z"),
			durationInHours: 2,
			totalPrice: 60,
			status: "active",
		},
	});

	// Add a teacher rating
	await prisma.teacherRating.create({
		data: {
			studentId: "cm5vix1bd0001xra4u7eda81v",
			teacherId: "cm5vixln20002xra438tsi5ih",
			classId: class1.id,
			rating: 5,
			review: "Great teacher, very helpful!",
		},
	});

	console.log("Mock data has been created!");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

import { auth } from "@/auth";
import prisma from "@/prisma";
import Stripe from "stripe";
import { isWithinAvailability } from "@/app/lib/availability/check-availability";

export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user?.email) {
		return Response.json({ error: "Not authenticated." }, { status: 401 });
	}

	const { teacherId, durationInHours, startTime } = await req.json();

	if (!teacherId || !durationInHours || !startTime) {
		return Response.json({ error: "Missing required fields." }, { status: 400 });
	}

	const teacher = await prisma.user.findUnique({
		where: { id: teacherId },
		select: { pricePerHour: true, firstName: true, lastName: true },
	});

	if (!teacher?.pricePerHour) {
		return Response.json({ error: "Teacher or price not found." }, { status: 404 });
	}

	// Availability check — only enforced if the teacher has configured slots
	const availabilitySlots = await prisma.teacherAvailability.findMany({
		where: { teacherId },
		select: { dayOfWeek: true, startHour: true, startMin: true },
	});

	const classStart = new Date(startTime);
	if (!isWithinAvailability(availabilitySlots, classStart, Number(durationInHours))) {
		return Response.json(
			{ error: "The teacher is not available at the selected time. Please choose a slot within their available hours." },
			{ status: 422 },
		);
	}

	// Check Study Boost
	const student = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { studentGameProfile: { select: { studyBoostActive: true } } },
	});
	const studyBoostActive = student?.studentGameProfile?.studyBoostActive ?? false;

	const basePrice = Number(teacher.pricePerHour) * Number(durationInHours);
	const totalPrice = studyBoostActive
		? Math.round(basePrice * 0.95 * 100) / 100
		: basePrice;
	const amountCents = Math.round(totalPrice * 100);

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

	const intent = await stripe.paymentIntents.create({
		amount: amountCents,
		currency: "eur",
		capture_method: "manual",
		metadata: {
			teacherId,
			durationInHours: String(durationInHours),
			createdByEmail: session.user.email,
			studyBoostApplied: String(studyBoostActive),
		},
	});

	return Response.json({
		clientSecret: intent.client_secret,
		intentId: intent.id,
		totalPrice,
		studyBoostApplied: studyBoostActive,
	});
}

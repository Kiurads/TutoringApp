import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { stripe } from "@/app/lib/stripe";

export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user?.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { classId } = await req.json();
	const classData = await fetchClassById(classId);

	if (!classData || !classData.totalPrice) {
		return NextResponse.json({ error: "Class not found" }, { status: 404 });
	}

	const amount = Math.round(parseFloat(classData.totalPrice) * 100);

	const paymentIntent = await stripe.paymentIntents.create({
		amount,
		currency: "eur",
		metadata: { classId: classData.id },
	});

	return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}

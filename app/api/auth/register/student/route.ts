import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import buildResponse from "@/app/utils/build-response";

export async function POST(request: NextRequest) {
	const { email, password, phoneNumber, firstName, lastName } =
		await request.json();

	if (!email || !password || !firstName || !lastName) {
		return buildResponse(
			"Email, password, first name and last name are required.",
			400
		);
	}

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			return buildResponse("User already exists", 400);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				phoneNumber,
				firstName,
				lastName,
			},
		});

		return buildResponse("User created", 201);
	} catch (error) {
		return buildResponse(error as string, 500);
	}
}

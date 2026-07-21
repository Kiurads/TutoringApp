"use server";

import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getClientIp, rateLimit } from "@/app/lib/auth/rate-limit";

// Deter signup spam: cap registration attempts per IP within a rolling
// ten-minute window. See rate-limit.ts for storage caveats.
const REGISTER_MAX_ATTEMPTS_PER_IP = 8;
const REGISTER_WINDOW_MS = 10 * 60_000;

export async function registerStudent(
	prevState: string | undefined,
	formData: FormData
) {
	const ip = await getClientIp();
	const ipLimit = rateLimit(
		`register:ip:${ip}`,
		REGISTER_MAX_ATTEMPTS_PER_IP,
		REGISTER_WINDOW_MS
	);
	if (!ipLimit.allowed) {
		return `Too many registration attempts. Please try again in ${Math.ceil(
			ipLimit.retryAfterSeconds / 60
		)} minute(s).`;
	}

	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const phoneNumber = formData.get("phoneNumber") as string;
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;

	if (!email) {
		return "Please enter a valid email";
	}

	if (!password) {
		return "Please enter a valid password";
	}

	if (!firstName) {
		return "Please enter a valid first name";
	}

	if (!lastName) {
		return "Please enter a valid last name";
	}

	if (phoneNumber && /^\d{9}$/.test(phoneNumber) == false) {
		return "Please enter a valid email";
	}

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) {
			return "User already exists";
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
	} catch (error) {
		console.log(error);

		return error as string;
	}

	redirect("/login");
}

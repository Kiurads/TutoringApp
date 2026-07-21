"use server";

import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { redirect } from "next/navigation";

// Helper to add a user in Nextcloud
async function addNextcloudUser({
	userid,
	password,
	displayName,
	group,
	email,
	quota,
}: {
	userid: string;
	password: string;
	displayName: string;
	group: string;
	email: string;
	quota: string;
}) {
	const url = `${process.env.NEXTCLOUD_URL}/ocs/v1.php/cloud/users`;

	const formData = new URLSearchParams();
	formData.append("userid", userid);
	formData.append("password", password);
	formData.append("displayName", displayName);
	formData.append("quota", quota);
	formData.append("email", email || "");
	formData.append("groups[]", group);

	const auth = `${process.env.NEXTCLOUD_USERNAME}:${process.env.NEXTCLOUD_PASSWORD}`;
	const basicAuth = Buffer.from(auth).toString("base64");

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"OCS-APIRequest": "true",
			Authorization: `Basic ${basicAuth}`,
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json", // request JSON instead of XML
		},
		body: formData.toString(),
	});

	if (!response.ok) {
		throw new Error(
			`HTTP error ${response.status}: ${response.statusText}`
		);
	}

	// Parse JSON response
	const data = (await response.json()) as {
		ocs: { meta: { statuscode: number; message: string; status: string } };
	};

	const { statuscode, message } = data.ocs.meta;

	if (statuscode !== 100) {
		throw new Error(`${message}`);
	}

	console.log("Nextcloud user created successfully");
}

export async function registerTeacher(
	prevState: string | undefined,
	formData: FormData
) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const phoneNumber = formData.get("phoneNumber") as string;
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;
	const subjects = formData.getAll("subjects") as string[];

	if (!email) return "Please enter a valid email";
	if (!password) return "Please enter a valid password";
	if (!firstName) return "Please enter a valid first name";
	if (!lastName) return "Please enter a valid last name";
	if (phoneNumber && /^\d{9}$/.test(phoneNumber) === false)
		return "Please enter a valid phone number";

	let teacherId: string;

	try {
		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) return "User already exists";

		const hashedPassword = await bcrypt.hash(password, 10);

		// Create teacher in DB first — this is the source of truth. Nextcloud
		// sync is a downstream side effect and must not be able to block or
		// roll back the actual account creation (see best-effort sync below).
		const teacher = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				phoneNumber,
				firstName,
				lastName,
				role: "teacher",
			},
		});
		teacherId = teacher.id;

		// Assign subjects
		if (subjects.length > 0) {
			await prisma.teacherSubject.createMany({
				data: subjects.map((subjectId) => ({
					teacherId: teacher.id,
					subjectId,
				})),
				skipDuplicates: true,
			});
		}

		console.log("Teacher created with ID:", teacher.id);
	} catch (error) {
		console.error(error);
		return error instanceof Error
			? error.message
			: "Something went wrong, please try again.";
	}

	// Sync teacher to Nextcloud — best effort, after the User row exists.
	// A Nextcloud outage/misconfiguration must never prevent teacher
	// registration; it just means the teacher's Nextcloud account is
	// missing until this can be retried/reconciled manually.
	//
	// Never forward the teacher's real site password to a third-party
	// system — generate an independent, random credential for Nextcloud
	// instead. It never needs to be typed by the teacher: file storage
	// access happens through the app's own Nextcloud integration, not by
	// the teacher logging into Nextcloud directly with this password.
	try {
		const nextcloudPassword = crypto.randomBytes(24).toString("base64url");

		await addNextcloudUser({
			userid: `${firstName}${lastName}`.toLowerCase(), // you can also use teacher.id here
			password: nextcloudPassword,
			displayName: `${firstName} ${lastName}`,
			group: "teacher",
			email,
			quota: "5GB",
		});
	} catch (error) {
		console.error(
			`Nextcloud sync failed for teacher ${teacherId} (${email}) — account was still created. This will need manual reconciliation.`,
			error
		);
	}

	redirect("/login");
}

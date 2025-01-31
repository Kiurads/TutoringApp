"use server";

import prisma from "@/prisma";

export async function getSubjects() {
	const subjects = await prisma.subject.findMany();

	console.log(subjects);

	return subjects;
}

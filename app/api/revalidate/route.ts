"use server";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
	const { path } = await req.json();

	// Revalidate the path
	revalidatePath(path);

	return NextResponse.json({ message: "Revalidation triggered" });
}

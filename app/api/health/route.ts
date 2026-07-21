import { NextResponse } from "next/server";
import prisma from "@/prisma";

/**
 * Liveness/readiness probe for the web service. Confirms the process is up
 * AND that it can actually reach the database, since a "the process
 * responds" check alone wouldn't catch a broken DATABASE_URL post-deploy.
 */
export async function GET() {
	try {
		await prisma.$queryRaw`SELECT 1`;
		return NextResponse.json({ status: "ok" });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json(
			{ status: "error", message },
			{ status: 503 },
		);
	}
}

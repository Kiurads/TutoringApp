import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";

// Consumes a VerificationToken created at registration (see
// app/lib/auth/verification.ts) and marks the corresponding User's
// emailVerified timestamp. Does not gate login — see plan.md Phase 11A,
// gating login on verification is an explicit follow-up, not done here.
export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get("token");

	if (!token) {
		return NextResponse.redirect(
			new URL("/login?verify=missing-token", request.url)
		);
	}

	// token isn't declared @unique on its own in the schema (only the
	// [identifier, token] pair is), so we look it up with findFirst.
	const verificationToken = await prisma.verificationToken.findFirst({
		where: { token },
	});

	if (!verificationToken) {
		return NextResponse.redirect(
			new URL("/login?verify=invalid-token", request.url)
		);
	}

	const isExpired = verificationToken.expires < new Date();

	// Clean up the token either way — used tokens and expired tokens should
	// not be redeemable again.
	await prisma.verificationToken
		.delete({
			where: {
				identifier_token: {
					identifier: verificationToken.identifier,
					token: verificationToken.token,
				},
			},
		})
		.catch(() => {
			// Already consumed by a concurrent request — fine, fall through.
		});

	if (isExpired) {
		return NextResponse.redirect(
			new URL("/login?verify=expired-token", request.url)
		);
	}

	try {
		await prisma.user.update({
			where: { email: verificationToken.identifier },
			data: { emailVerified: new Date() },
		});
	} catch (error) {
		// User may have been deleted since the token was issued.
		console.error(
			`Failed to mark emailVerified for ${verificationToken.identifier}:`,
			error
		);
		return NextResponse.redirect(
			new URL("/login?verify=user-not-found", request.url)
		);
	}

	return NextResponse.redirect(new URL("/login?verify=success", request.url));
}

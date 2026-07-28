import bcrypt from "bcryptjs";
import prisma from "@/prisma";

// A precomputed bcrypt hash of a value nobody will ever type as a real
// password. Compared against when no matching user exists, so
// bcrypt.compareSync always runs for the same cost regardless of whether
// the email is registered — otherwise an early "no such user" return makes
// a nonexistent-account login fail near-instantly while a wrong-password
// one takes bcrypt's full compare time, letting an attacker enumerate
// registered emails purely from response timing.
const DUMMY_PASSWORD_HASH = "$2a$10$Fq3YkRH.LYDJ8rxsXQyIC.Md6PWp9ceQs993tjwkwZhIUpa.L.Dry";

export interface VerifiedUser {
	id: string;
	email: string;
	role: string;
	teacherPreferencesSet: boolean;
	passwordChangedAt: Date | null;
}

/**
 * Looks up a user by email and checks the given password against it,
 * timing-safe with respect to whether the account exists — see
 * DUMMY_PASSWORD_HASH above. Returns null for either "no such user" or
 * "wrong password"; callers must not distinguish the two in their response.
 */
export async function verifyCredentials(
	email: string,
	password: string,
): Promise<VerifiedUser | null> {
	const user = await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			password: true,
			role: true,
			teachingStyle: true,
			passwordChangedAt: true,
		},
	});

	const isMatch = bcrypt.compareSync(password, user?.password ?? DUMMY_PASSWORD_HASH);

	if (!user || !isMatch) return null;

	return {
		id: user.id,
		email: user.email,
		role: user.role,
		// Non-teachers are never gated on this, so `true` is a safe default.
		teacherPreferencesSet: user.role === "teacher" ? user.teachingStyle !== null : true,
		passwordChangedAt: user.passwordChangedAt,
	};
}

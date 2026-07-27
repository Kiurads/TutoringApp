import type { JWT } from "next-auth/jwt";

/**
 * Compares a JWT's stamped-at-login passwordChangedAt against the live value
 * from the DB, and marks the token invalidated if they differ — i.e. the
 * password changed after this token was issued. Pulled out of auth.ts's jwt
 * callback as a pure function so it's testable without instantiating
 * NextAuth/Prisma — see auth.ts for how the DB lookup itself is wired in.
 */
export function applyPasswordStalenessCheck(
	token: JWT,
	dbPasswordChangedAt: number | null,
): JWT {
	const tokenChangedAt = token.passwordChangedAt ?? null;
	if (dbPasswordChangedAt !== tokenChangedAt) {
		return { ...token, invalidated: true };
	}
	return token;
}

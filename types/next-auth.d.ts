import "next-auth";

declare module "next-auth" {
	interface User {
		role?: string;
		teacherPreferencesSet?: boolean;
		passwordChangedAt?: Date | null;
	}
	interface Session {
		user: {
			role?: string;
			teacherPreferencesSet?: boolean;
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		role?: string;
		teacherPreferencesSet?: boolean;
		// Epoch ms of the User.passwordChangedAt value at the moment this
		// token was issued/refreshed — null if the password has never been
		// changed. Compared against the live DB value on each request in
		// auth.ts to detect and invalidate stale sessions.
		passwordChangedAt?: number | null;
		// Set once the comparison above finds a mismatch. The session
		// callback in auth.config.ts checks this and stops presenting a
		// user, regardless of the JWT's own (still cryptographically valid)
		// signature/expiry.
		invalidated?: boolean;
	}
}

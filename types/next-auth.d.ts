import "next-auth";

declare module "next-auth" {
	interface User {
		role?: string;
		teacherPreferencesSet?: boolean;
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
	}
}

import { User } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
	pages: {
		signIn: "/login",
		signOut: "/signout",
	},
	callbacks: {
		jwt: async ({ token, user }) => {
			if (user) token.role = (user as User).role;
			return token;
		},
		session: async ({ session, token }) => {
			// We add the role to the session object
			if (session.user) session.user.role = token.role as string;
			return session;
		},
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;
			const role = auth?.user?.role;

			const roleBasePaths: Record<string, string> = {
				student: "/main/student",
				teacher: "/main/teacher",
				admin: "/main/admin",
			};

			const isOnHomePage = nextUrl.pathname === "/";
			const isOnRolePage = role
				? nextUrl.pathname.startsWith(roleBasePaths[role])
				: false;

			if (!isLoggedIn) {
				if (
					nextUrl.pathname.startsWith("/main/student") ||
					nextUrl.pathname.startsWith("/main/teacher") ||
					nextUrl.pathname.startsWith("/main/admin")
				) {
					return false; // redirect to /login
				}
				return true;
			}

			if (!role) {
				return Response.redirect(new URL("/unauthorized", nextUrl));
			}

			if (isOnHomePage || !isOnRolePage) {
				return Response.redirect(
					new URL(`${roleBasePaths[role]}/dashboard`, nextUrl)
				);
			}

			return true; // allow access
		},
	},
	providers: [], // add credentials, Google, etc.
} satisfies NextAuthConfig;

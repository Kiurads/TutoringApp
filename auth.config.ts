import { User } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
	pages: {
		signIn: "/login",
		signOut: "/signout",
	},
	callbacks: {
		jwt: async ({ token, user, trigger, session }) => {
			if (user) {
				token.role = (user as User).role;
				token.teacherPreferencesSet = (
					user as User & { teacherPreferencesSet?: boolean }
				).teacherPreferencesSet;
			}
			// Fired by the client via useSession().update({ teacherPreferencesSet: true })
			// right after a teacher submits their mandatory preferences form — without
			// this, the JWT would keep saying `false` until the next full login, and
			// middleware would keep bouncing the teacher back to the onboarding page.
			if (trigger === "update" && typeof session?.teacherPreferencesSet === "boolean") {
				token.teacherPreferencesSet = session.teacherPreferencesSet;
			}
			return token;
		},
		session: async ({ session, token }) => {
			// We add the role to the session object
			if (session.user) {
				session.user.role = token.role as string;
				session.user.teacherPreferencesSet = token.teacherPreferencesSet as boolean;
			}
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

			// Teachers cannot skip setting their teaching preferences — this is
			// enforced here (not just in the UI) so directly navigating to
			// another /main/teacher/* URL can't bypass it.
			const teacherOnboardingPath = "/main/teacher/onboarding";
			if (
				role === "teacher" &&
				auth?.user?.teacherPreferencesSet === false &&
				nextUrl.pathname !== teacherOnboardingPath
			) {
				return Response.redirect(new URL(teacherOnboardingPath, nextUrl));
			}

			return true; // allow access
		},
	},
	providers: [], // add credentials, Google, etc.
} satisfies NextAuthConfig;

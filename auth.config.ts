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
				token.passwordChangedAt =
					(user as User & { passwordChangedAt?: Date | null }).passwordChangedAt?.getTime() ??
					null;
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
			// A stale token (password changed since it was issued — see the
			// Prisma-backed check layered on top of this jwt callback in
			// auth.ts) must stop presenting a user at all, not just expire
			// naturally on its own schedule.
			if (token.invalidated) {
				return { ...session, user: undefined } as typeof session;
			}
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

			// Locale-prefixed routing (next-intl, "as-needed" mode): English,
			// the default locale, keeps today's unprefixed paths; Portuguese
			// carries a /pt prefix. Strip it before matching so the rest of
			// this callback's path logic stays exactly as it was pre-i18n,
			// then re-add it (localePrefix) when building redirect targets.
			const ptMatch = nextUrl.pathname.match(/^\/pt(\/|$)/);
			const localePrefix = ptMatch ? "/pt" : "";
			const path = ptMatch ? nextUrl.pathname.slice(3) || "/" : nextUrl.pathname;

			const roleBasePaths: Record<string, string> = {
				student: "/main/student",
				teacher: "/main/teacher",
				admin: "/main/admin",
			};

			const isOnHomePage = path === "/";
			const isOnRolePage = role
				? path.startsWith(roleBasePaths[role])
				: false;

			if (!isLoggedIn) {
				if (
					path.startsWith("/main/student") ||
					path.startsWith("/main/teacher") ||
					path.startsWith("/main/admin")
				) {
					return false; // redirect to /login
				}
				return true;
			}

			if (!role) {
				return Response.redirect(new URL(`${localePrefix}/unauthorized`, nextUrl));
			}

			if (isOnHomePage || !isOnRolePage) {
				return Response.redirect(
					new URL(`${localePrefix}${roleBasePaths[role]}/dashboard`, nextUrl)
				);
			}

			// Teachers cannot skip setting their teaching preferences — this is
			// enforced here (not just in the UI) so directly navigating to
			// another /main/teacher/* URL can't bypass it.
			const teacherOnboardingPath = "/main/teacher/onboarding";
			if (
				role === "teacher" &&
				auth?.user?.teacherPreferencesSet === false &&
				path !== teacherOnboardingPath
			) {
				return Response.redirect(new URL(`${localePrefix}${teacherOnboardingPath}`, nextUrl));
			}

			return true; // allow access
		},
	},
	providers: [], // add credentials, Google, etc.
} satisfies NextAuthConfig;

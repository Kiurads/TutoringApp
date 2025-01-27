import type { NextAuthConfig } from "next-auth";

export const authConfig = {
	pages: {
		signIn: "/login",
		signOut: "/signout",
	},
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;
			const isOnHomePage = nextUrl.pathname === "/";
			const isOnUserPage = nextUrl.pathname.startsWith("/main");
			if (isOnUserPage) {
				if (isLoggedIn) return true;
				return false; // Redirect unauthenticated users to login page
			} else if (isLoggedIn) {
				if (isOnHomePage) {
					return Response.redirect(
						new URL("/main/dashboard", nextUrl)
					);
				}

				return Response.redirect(new URL("/main/dashboard", nextUrl));
			}
			return true;
		},
	},
	providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

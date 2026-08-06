import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// NextAuth must be the outer wrapper: `authorized()` needs to see the raw
// incoming pathname (unprefixed for English, /pt-prefixed for Portuguese —
// see auth.config.ts) before next-intl's middleware runs and resolves/
// rewrites the locale.
//
// Important: `auth((req) => ...)` — the *wrapped-handler* form — does NOT
// automatically enforce `callbacks.authorized` the way the bare `export
// default auth` form does. It only injects `req.auth`; the gating has to be
// invoked explicitly here, or every route silently becomes unprotected.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const authorized = authConfig.callbacks.authorized({
		auth: req.auth,
		request: req,
	});

	if (authorized instanceof Response) {
		return authorized;
	}
	if (!authorized) {
		const signInUrl = new URL(authConfig.pages!.signIn!, req.nextUrl);
		signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
		return NextResponse.redirect(signInUrl);
	}

	return intlMiddleware(req);
});

export const config = {
	// Every real page route needs to go through this (next-intl has to resolve
	// a locale for all of them, not just the auth-gated ones — the file tree
	// lives entirely under app/[locale]/ now). Excludes api routes, Next.js
	// internals, the app-root metadata routes (icon/apple-icon/opengraph-image
	// have no file extension in their URL, so the dotted-path exclusion below
	// doesn't catch them), and anything with a dot (static files, robots.txt,
	// sitemap.xml).
	matcher: ["/((?!api|_next|_vercel|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};

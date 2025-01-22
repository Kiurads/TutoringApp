import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Get token using next-auth
	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
	});

	// Handle public routes
	const isPublicPath =
		pathname.startsWith("/login") ||
		pathname.startsWith("/register") ||
		pathname.startsWith("/") ||
		pathname === "/favicon.ico";

	if (isPublicPath) {
		return NextResponse.next();
	}

	// Redirect to login if no token found
	if (!token) {
		const url = new URL("/register/student", request.url);
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	// Handle admin routes
	if (pathname.startsWith("/admin")) {
		if (token.role !== "admin") {
			return NextResponse.redirect(
				new URL("/auth/unauthorized", request.url)
			);
		}
	}

	// Handle protected API routes
	if (pathname.startsWith("/api/protected")) {
		if (!token) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}
	}

	// Allow authenticated requests to proceed
	return NextResponse.next();
}

export const config = {
	matcher: [
		// Match all paths except static assets
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};

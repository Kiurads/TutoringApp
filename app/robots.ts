import type { MetadataRoute } from "next";

// /main/** is the entire authenticated app (student/teacher/admin dashboards)
// — an unauthenticated crawl hit there just redirects to /login per
// auth.config.ts, so there's nothing worth indexing and no reason to spend
// crawl budget on it. /api/** is route handlers, never a page.
export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	return {
		rules: {
			userAgent: "*",
			// Portuguese routes carry a /pt prefix (next-intl, "as-needed" mode
			// — see i18n/routing.ts); English stays unprefixed. Both variants of
			// /main/ need disallowing.
			disallow: ["/main/", "/pt/main/", "/api/"],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}

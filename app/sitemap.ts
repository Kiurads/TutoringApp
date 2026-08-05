import type { MetadataRoute } from "next";

// Static for now — the only public, indexable surface today is a handful of
// marketing/auth routes (see middleware.ts's matcher + auth.config.ts for
// what's actually gated behind /main/**). /register is deliberately omitted:
// it's a redirect to /register/student (see #141), and a sitemap entry for
// something that immediately redirects doesn't help — list the canonical
// target instead. Revisit once public teacher/subject pages exist (#146) —
// this should then query them from the DB rather than staying a fixed list.
export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const routes = [
		{ path: "/", priority: 1.0, changeFrequency: "weekly" as const },
		{ path: "/login", priority: 0.5, changeFrequency: "yearly" as const },
		{ path: "/register/student", priority: 0.8, changeFrequency: "yearly" as const },
		{ path: "/register/teacher", priority: 0.3, changeFrequency: "yearly" as const },
		{ path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" as const },
		{ path: "/terms-of-service", priority: 0.2, changeFrequency: "yearly" as const },
	];

	return routes.map((route) => ({
		url: `${baseUrl}${route.path}`,
		lastModified: new Date(),
		changeFrequency: route.changeFrequency,
		priority: route.priority,
	}));
}

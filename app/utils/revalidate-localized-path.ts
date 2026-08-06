import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

// next/cache's revalidatePath needs the path Next.js actually rendered —
// since every route now lives under app/[locale]/ (see #162), that's
// "/en/main/student/dashboard", not the unprefixed "/main/student/dashboard"
// a caller sees in the browser for the default locale (next-intl's "as-needed"
// prefix mode hides the /en segment from the URL via an internal rewrite, but
// revalidatePath isn't locale-aware and needs the real one). A Server Action
// doesn't know which locale triggered it, so revalidate every locale's copy.
export default function revalidateLocalizedPath(path: string, type?: "layout" | "page") {
	for (const locale of routing.locales) {
		if (type) {
			revalidatePath(`/${locale}${path}`, type);
		} else {
			revalidatePath(`/${locale}${path}`);
		}
	}
}

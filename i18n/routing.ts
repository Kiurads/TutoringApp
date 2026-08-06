import { defineRouting } from "next-intl/routing";

// "as-needed": English (the default locale) keeps today's unprefixed URLs
// (`/login`, `/main/student/dashboard`, ...) completely unchanged — only
// Portuguese gets a visible `/pt` prefix. This is what lets the rest of the
// app's hardcoded absolute paths (auth.config.ts's role-based redirects,
// every <Link href="/main/...">) keep working without a rewrite: only the
// `/pt` case needs explicit locale-prefix handling, added where relevant.
export const routing = defineRouting({
	locales: ["en", "pt"],
	defaultLocale: "en",
	localePrefix: "as-needed",
});

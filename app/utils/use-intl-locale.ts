import { useLocale } from "next-intl";

// Client-component counterpart to app/utils/get-intl-locale.ts (server-only,
// uses next-intl/server's getLocale). Same BCP-47 mapping rationale.
export default function useIntlLocale(
	englishTag: "en-US" | "en-GB" = "en-GB",
): string {
	const locale = useLocale();
	return locale === "pt" ? "pt-PT" : englishTag;
}

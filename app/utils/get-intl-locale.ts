import { getLocale } from "next-intl/server";

// next-intl's locale ("en"/"pt") isn't itself a valid BCP-47 tag for
// Intl.DateTimeFormat/toLocaleDateString — it needs a real region subtag.
// Centralizes that mapping so date/time formatting stays consistent with the
// active locale instead of a hardcoded "en-GB"/"en-US". `englishTag` lets a
// call site keep whichever English format convention (day-month-year vs
// month-day-year) it already had before i18n.
export default async function getIntlLocale(
	englishTag: "en-US" | "en-GB" = "en-GB",
): Promise<string> {
	const locale = await getLocale();
	return locale === "pt" ? "pt-PT" : englishTag;
}

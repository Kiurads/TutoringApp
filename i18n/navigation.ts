import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers for next/link, next/navigation's redirect/usePathname/
// useRouter — swap these in for new code that needs to stay on the current
// locale when navigating. Existing plain next/link and next/navigation calls
// throughout the app keep working as-is for English (the default, unprefixed
// locale); adopting these everywhere is tracked separately (#163).
export const { Link, getPathname, redirect, usePathname, useRouter } =
	createNavigation(routing);

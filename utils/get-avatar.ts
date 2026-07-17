import { buildAvatarDataUri, parseAvatarOptions } from "@/app/lib/avatar-utils";

/**
 * Returns a toon-head avatar as a data URI (generated locally, no network request).
 * @param email  - Used as the seed so the avatar is consistent per user.
 * @param optionsJson - Optional JSON string from User.avatarOptions (may be null).
 */
export default function getAvatar(email: string, optionsJson?: string | null): string {
	return buildAvatarDataUri(email, parseAvatarOptions(optionsJson));
}

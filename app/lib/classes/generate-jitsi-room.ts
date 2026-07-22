import { randomBytes } from "crypto";

/**
 * Generates an unguessable Jitsi Meet room name, independent of the class's
 * own id — decouples video-call access from the class's primary key (which
 * may end up in emails/logs later) and lets a compromised room be rotated
 * without touching anything else.
 */
export function generateJitsiRoom(): string {
	return `learning-nexus-${randomBytes(16).toString("hex")}`;
}

/**
 * Utilities for student profile frames (cosmetic store items).
 *
 * Frames are stored as a comma-separated string in StudentGameProfile.ownedFrames.
 * The active frame is explicitly chosen by the student and stored in activeFrame.
 */

/** Parse a raw comma-separated ownedFrames string to an array. */
export function parseOwnedFrames(raw: string | null | undefined): string[] {
	if (!raw) return [];
	return raw.split(",").filter(Boolean);
}

/**
 * CSS class to apply to the wrapping element of an avatar image to show the
 * animated frame.  Classes are defined in globals.css.
 * Returns an empty string if no frame.
 */
export function getFrameClass(frameKey: string | null): string {
	switch (frameKey) {
		case "scholar":  return "frame-scholar";
		case "luminary": return "frame-luminary";
		case "sage":     return "frame-sage";
		default:         return "";
	}
}

/** Human-readable label for a frame key. */
export function getFrameLabel(frameKey: string): string {
	switch (frameKey) {
		case "scholar":  return "Scholar Frame";
		case "luminary": return "Luminary Frame";
		case "sage":     return "Sage Frame";
		default:         return frameKey;
	}
}

/** Icon color class for a frame key (matches store catalog). */
export function getFrameColor(frameKey: string): string {
	switch (frameKey) {
		case "scholar":  return "text-warning";
		case "luminary": return "text-accent";
		case "sage":     return "text-success";
		default:         return "text-base-content";
	}
}

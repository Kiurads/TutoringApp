import { createAvatar } from "@dicebear/core";
import { toonHead } from "@dicebear/collection";

/** All options that can be customised on a toon-head avatar. */
export interface AvatarOptions {
	skinColor: string;
	hair: string;
	showHair: boolean;
	hairColor: string;
	rearHair: string;
	showRearHair: boolean;
	eyes: string;
	eyebrows: string;
	mouth: string;
	clothes: string;
	clothesColor: string;
	showBeard: boolean;
	beard: string;
	backgroundColor: string;
	backgroundType: "solid" | "gradientLinear";
	backgroundRotation: number;
	radius: number;    // 0 = square, 20 = rounded, 50 = circle
	flip: boolean;
}

/* ── Valid values from https://www.dicebear.com/styles/toon-head/ ─────────── */

export const VALID_SKIN_COLORS    = ["f1c3a5", "c68e7a", "b98e6a", "a36b4f", "5c3829"] as const;
export const VALID_HAIR_COLORS    = ["d6b370", "b58143", "a55728", "724133", "2c1b18"] as const;
export const VALID_HAIR_STYLES    = ["bun", "sideComed", "spiky", "undercut"] as const;
export const VALID_REAR_HAIR      = ["neckHigh", "shoulderHigh", "longStraight", "longWavy"] as const;
export const VALID_EYES           = ["bow", "happy", "humble", "wide", "wink"] as const;
export const VALID_EYEBROWS       = ["angry", "happy", "neutral", "raised", "sad"] as const;
export const VALID_MOUTHS         = ["agape", "angry", "laugh", "sad", "smile"] as const;
export const VALID_CLOTHES        = ["dress", "openJacket", "shirt", "tShirt", "turtleNeck"] as const;
export const VALID_CLOTHES_COLORS = ["151613", "545454", "e8e9e6", "b11f1f", "0b3286", "147f3c", "eab308", "731ac3", "ec4899", "f97316"] as const;
export const VALID_BEARDS         = ["chin", "chinMoustache", "fullBeard", "longBeard", "moustacheTwirl"] as const;

function fallback<T>(value: T, valid: readonly T[], def: T): T {
	return (valid as readonly unknown[]).includes(value) ? value : def;
}

/** Sensible starting point shown when a user hasn't customised yet. */
export const DEFAULT_OPTIONS: AvatarOptions = {
	skinColor: "f1c3a5",
	hair: "undercut",
	showHair: true,
	hairColor: "2c1b18",
	rearHair: "neckHigh",
	showRearHair: false,
	eyes: "happy",
	eyebrows: "raised",
	mouth: "smile",
	clothes: "tShirt",
	clothesColor: "0b3286",
	showBeard: false,
	beard: "chin",
	backgroundColor: "b6e3f4",
	backgroundType: "solid",
	backgroundRotation: 0,
	radius: 50,
	flip: false,
};

/** Sanitise stored options — enum fields are validated, hex colors accept any valid 6-digit hex. */
function sanitize(o: AvatarOptions): AvatarOptions {
	return {
		...o,
		skinColor: fallback(o.skinColor, VALID_SKIN_COLORS, DEFAULT_OPTIONS.skinColor),
		hair:      fallback(o.hair,      VALID_HAIR_STYLES,  DEFAULT_OPTIONS.hair),
		rearHair:  fallback(o.rearHair,  VALID_REAR_HAIR,    DEFAULT_OPTIONS.rearHair),
		eyes:      fallback(o.eyes,      VALID_EYES,         DEFAULT_OPTIONS.eyes),
		eyebrows:  fallback(o.eyebrows,  VALID_EYEBROWS,     DEFAULT_OPTIONS.eyebrows),
		mouth:     fallback(o.mouth,     VALID_MOUTHS,       DEFAULT_OPTIONS.mouth),
		clothes:   fallback(o.clothes,   VALID_CLOTHES,      DEFAULT_OPTIONS.clothes),
		beard:     fallback(o.beard,     VALID_BEARDS,       DEFAULT_OPTIONS.beard),
		// hairColor and clothesColor accept any 6-digit hex in local generation
	};
}

/**
 * Generate a toon-head SVG locally (no network request) and return a data URI.
 * Use this everywhere possible instead of buildAvatarUrl.
 */
export function buildAvatarDataUri(seed: string, options?: AvatarOptions | null): string {
	const o = options ? sanitize(options) : null;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const avatar = createAvatar(toonHead, {
		seed,
		...(o ? {
			skinColor:           [o.skinColor],
			hair:                o.showHair ? [o.hair] : [],
			hairColor:           [o.hairColor],
			hairProbability:     o.showHair ? 100 : 0,
			rearHair:            [o.rearHair],
			rearHairProbability: o.showRearHair ? 100 : 0,
			eyes:                [o.eyes],
			eyebrows:            [o.eyebrows],
			mouth:               [o.mouth],
			clothes:             [o.clothes],
			clothesColor:        [o.clothesColor],
			beard:               [o.beard],
			beardProbability:    o.showBeard ? 100 : 0,
			backgroundColor:     o.backgroundColor !== "transparent" ? [o.backgroundColor] : [],
			backgroundType:      [o.backgroundType],
			backgroundRotation:  [o.backgroundRotation],
			radius:              0, // always square background
			flip:                o.flip,
		} : {}),
	} as any);

	return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`;
}

/** Build a DiceBear toon-head URL from a seed + optional custom options. */
export function buildAvatarUrl(seed: string, options?: AvatarOptions | null): string {
	const p: string[] = [
		`seed=${encodeURIComponent(seed)}`,
		"radius=50",
		"size=128",
	];

	if (!options) return `https://api.dicebear.com/9.x/toon-head/svg?${p.join("&")}`;

	const o = sanitize(options);

	p.push(`skinColor[]=${o.skinColor}`);

	if (o.showHair) {
		p.push(`hair[]=${o.hair}`);
		p.push(`hairColor[]=${o.hairColor}`);
		p.push("hairProbability=100");
	} else {
		p.push("hairProbability=0");
	}

	if (o.showRearHair) {
		p.push(`rearHair[]=${o.rearHair}`);
		p.push("rearHairProbability=100");
	} else {
		p.push("rearHairProbability=0");
	}

	p.push(`eyes[]=${o.eyes}`);
	p.push(`eyebrows[]=${o.eyebrows}`);
	p.push(`mouth[]=${o.mouth}`);
	p.push(`clothes[]=${o.clothes}`);
	p.push(`clothesColor[]=${o.clothesColor}`);

	if (o.showBeard) {
		p.push(`beard[]=${o.beard}`);
		p.push("beardProbability=100");
	} else {
		p.push("beardProbability=0");
	}

	if (o.backgroundColor && o.backgroundColor !== "transparent") {
		p.push(`backgroundColor[]=${o.backgroundColor}`);
	} else if (o.backgroundColor === "transparent") {
		p.push("backgroundColor[]=transparent");
	}

	if (o.backgroundType === "gradientLinear") {
		p.push("backgroundType[]=gradientLinear");
		p.push(`backgroundRotation[]=${o.backgroundRotation ?? 0}`);
	}

	p.push(`radius=${o.radius ?? 50}`);

	if (o.flip) p.push("flip=true");

	return `https://api.dicebear.com/9.x/toon-head/svg?${p.join("&")}`;
}

/** Safely parse a JSON avatarOptions string from the DB. */
export function parseAvatarOptions(json: string | null | undefined): AvatarOptions | null {
	if (!json) return null;
	try {
		return JSON.parse(json) as AvatarOptions;
	} catch {
		return null;
	}
}

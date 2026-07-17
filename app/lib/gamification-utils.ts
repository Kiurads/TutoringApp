// Pure utility functions — no server action directive needed

export const TIER_THRESHOLDS = [0, 500, 1500, 3500, 7500] as const;
export const TIER_NAMES = [
	"Aspiring Learner",
	"Dedicated Student",
	"Scholar",
	"Luminary",
	"Sage",
] as const;

export const RANK_THRESHOLDS = [0, 500, 1500, 3500, 7500] as const;
export const RANK_NAMES = [
	"Associate Mentor",
	"Senior Instructor",
	"Master Educator",
	"Elite Mentor",
	"Global Academic Lead",
] as const;

export function calcTier(gems: number): number {
	for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
		if (gems >= TIER_THRESHOLDS[i]) return i;
	}
	return 0;
}

export function calcRank(sparks: number): number {
	for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
		if (sparks >= RANK_THRESHOLDS[i]) return i;
	}
	return 0;
}

export function getTierName(tier: number): string {
	return TIER_NAMES[Math.min(tier, TIER_NAMES.length - 1)];
}

export function getTierProgress(
	gems: number,
): { current: number; next: number; pct: number } {
	const tier = calcTier(gems);
	const current = TIER_THRESHOLDS[tier];
	const next = TIER_THRESHOLDS[Math.min(tier + 1, TIER_THRESHOLDS.length - 1)];
	if (current === next) return { current: gems, next: gems, pct: 100 };
	return {
		current: gems - current,
		next: next - current,
		pct: Math.round(((gems - current) / (next - current)) * 100),
	};
}

export function getRankName(rank: number): string {
	return RANK_NAMES[Math.min(rank, RANK_NAMES.length - 1)];
}

export function getRankProgress(
	sparks: number,
): { current: number; next: number; pct: number } {
	const rank = calcRank(sparks);
	const current = RANK_THRESHOLDS[rank];
	const next = RANK_THRESHOLDS[Math.min(rank + 1, RANK_THRESHOLDS.length - 1)];
	if (current === next) return { current: sparks, next: sparks, pct: 100 };
	return {
		current: sparks - current,
		next: next - current,
		pct: Math.round(((sparks - current) / (next - current)) * 100),
	};
}

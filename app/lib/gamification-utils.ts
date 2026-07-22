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

// Monday 00:00 UTC of the week containing `date` — the unit for the weekly
// activity streak and weekly quests. UTC-anchored (not the server's local
// time) so it's stable regardless of where this runs.
export function getWeekStart(date: Date): Date {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const day = d.getUTCDay(); // 0=Sun..6=Sat
	const diffToMonday = (day + 6) % 7; // Mon->0, Tue->1, ..., Sun->6
	d.setUTCDate(d.getUTCDate() - diffToMonday);
	return d;
}

// ── Weekly activity streak — pure branching logic ───────────────────────────
//
// Lives here rather than in gamification.ts (which has "use server", and a
// Server Actions file requires every export to be an async function) so it
// can be unit tested as a plain synchronous function with no database.
// See updateActivityStreak in gamification.ts for the DB glue and the full
// design rationale (weekly not daily, freeze grace, no loss-aversion
// notification on a broken streak).
const FREEZE_EARNED_EVERY_N_WEEKS = 4;

export interface StreakState {
	currentStreakWeeks: number;
	longestStreakWeeks: number;
	streakFreezes: number;
	lastActivityAt: Date | null;
}

export type StreakUpdate =
	| { kind: "first_activity" }
	| { kind: "already_counted" }
	| { kind: "continued"; newStreak: number; newLongest: number; newFreezes: number; usedFreeze: boolean }
	| { kind: "broken" };

export function computeStreakUpdate(before: StreakState | null, now: Date): StreakUpdate {
	if (!before?.lastActivityAt) return { kind: "first_activity" };

	const thisWeek = getWeekStart(now);
	const lastWeek = getWeekStart(before.lastActivityAt);
	const weeksDiff = Math.round((thisWeek.getTime() - lastWeek.getTime()) / (7 * 24 * 3_600_000));

	if (weeksDiff === 0) return { kind: "already_counted" };

	const canUseFreeze = weeksDiff === 2 && before.streakFreezes > 0;
	if (weeksDiff === 1 || canUseFreeze) {
		const newStreak = before.currentStreakWeeks + 1;
		const newLongest = Math.max(newStreak, before.longestStreakWeeks);
		const earnsFreeze = newStreak % FREEZE_EARNED_EVERY_N_WEEKS === 0;
		const newFreezes = before.streakFreezes - (canUseFreeze ? 1 : 0) + (earnsFreeze ? 1 : 0);
		return { kind: "continued", newStreak, newLongest, newFreezes, usedFreeze: canUseFreeze };
	}

	return { kind: "broken" };
}

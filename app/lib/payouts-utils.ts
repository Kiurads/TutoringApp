// Pure utility functions — no server action directive needed

export const DEFAULT_PLATFORM_FEE_BPS = 1500; // 15%, in basis points

export interface CommissionSplit {
	platformFeeAmount: number;
	teacherPayoutAmount: number;
	platformFeeRateBps: number;
}

// Computes the platform/teacher split for a captured class charge, flat-rate
// for now. Takes an optional rate override so a future tier-based discount
// (e.g. tied to TeacherGameProfile.mentorshipRank) is a call-site change,
// not a rearchitecture. Rounds from total cents first so the two halves
// always add back up to exactly `amount` — never off by a cent.
export function computeCommissionSplit(
	amount: number,
	feeRateBps: number = DEFAULT_PLATFORM_FEE_BPS,
): CommissionSplit {
	const totalCents = Math.round(amount * 100);
	const feeCents = Math.round((totalCents * feeRateBps) / 10000);
	const payoutCents = totalCents - feeCents;

	return {
		platformFeeAmount: feeCents / 100,
		teacherPayoutAmount: payoutCents / 100,
		platformFeeRateBps: feeRateBps,
	};
}

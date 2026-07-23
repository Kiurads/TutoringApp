import { describe, it, expect } from "vitest";
import { computeCommissionSplit, DEFAULT_PLATFORM_FEE_BPS } from "./payouts-utils";

describe("computeCommissionSplit", () => {
	it("splits at the default 15% rate", () => {
		const split = computeCommissionSplit(100);

		expect(split.platformFeeAmount).toBe(15);
		expect(split.teacherPayoutAmount).toBe(85);
		expect(split.platformFeeRateBps).toBe(DEFAULT_PLATFORM_FEE_BPS);
	});

	it("always adds back up to the original amount exactly, even with awkward cents", () => {
		const amounts = [33.33, 19.99, 0.01, 123.45, 7.77];

		for (const amount of amounts) {
			const split = computeCommissionSplit(amount);
			const total = Math.round((split.platformFeeAmount + split.teacherPayoutAmount) * 100);
			expect(total).toBe(Math.round(amount * 100));
		}
	});

	it("accepts a custom fee rate override", () => {
		const split = computeCommissionSplit(100, 1000); // 10%

		expect(split.platformFeeAmount).toBe(10);
		expect(split.teacherPayoutAmount).toBe(90);
		expect(split.platformFeeRateBps).toBe(1000);
	});

	it("returns zero split for a zero amount", () => {
		const split = computeCommissionSplit(0);

		expect(split.platformFeeAmount).toBe(0);
		expect(split.teacherPayoutAmount).toBe(0);
	});
});

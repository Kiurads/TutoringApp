import { describe, it, expect } from "vitest";
import { computeClassPrice } from "./compute-class-price";

describe("computeClassPrice", () => {
	it("computes the base price with no discount by default", () => {
		expect(computeClassPrice(30, 2)).toBe(60);
	});

	it("computes the base price when studyBoostActive is explicitly false", () => {
		expect(computeClassPrice(30, 2, false)).toBe(60);
	});

	it("applies a 5% discount when studyBoostActive is true", () => {
		expect(computeClassPrice(30, 2, true)).toBe(57);
	});

	it("rounds the discounted price to 2 decimal places", () => {
		expect(computeClassPrice(33, 1.5, true)).toBeCloseTo(47.03, 2);
	});

	it("handles fractional durations", () => {
		expect(computeClassPrice(40, 0.5)).toBe(20);
	});
});

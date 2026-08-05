import { describe, it, expect } from "vitest";
import { isWithinAvailability } from "./check-availability";

describe("isWithinAvailability", () => {
	it("treats a teacher with no slots as always available", () => {
		expect(isWithinAvailability([], new Date("2026-01-05T09:00:00.000Z"), 1)).toBe(true);
	});

	it("matches a single 30-minute slot in UTC (default timezone, preserves old behavior)", () => {
		// 2026-01-05 is a Monday
		const slots = [{ dayOfWeek: 1, startHour: 9, startMin: 0 }];
		expect(isWithinAvailability(slots, new Date("2026-01-05T09:00:00.000Z"), 0.5)).toBe(true);
		expect(isWithinAvailability(slots, new Date("2026-01-05T09:30:00.000Z"), 0.5)).toBe(false);
	});

	it("rejects a class spanning a gap in the slot list", () => {
		const slots = [
			{ dayOfWeek: 1, startHour: 9, startMin: 0 },
			// 9:30 missing
			{ dayOfWeek: 1, startHour: 10, startMin: 0 },
		];
		expect(isWithinAvailability(slots, new Date("2026-01-05T09:00:00.000Z"), 1.5)).toBe(false);
	});

	// Lisbon (WET/WEST) is UTC+0 in winter, UTC+1 in summer (DST) — good for
	// exercising both a zero-offset and a non-zero-offset case with one zone.
	describe("timezone conversion", () => {
		it("converts a UTC instant into the teacher's local day/hour before matching (winter, UTC+0)", () => {
			// 2026-01-05T09:00Z is 09:00 in Lisbon in January (no DST) — should
			// match a slot recorded as "Monday 9:00" in the teacher's local time.
			const slots = [{ dayOfWeek: 1, startHour: 9, startMin: 0 }];
			expect(
				isWithinAvailability(slots, new Date("2026-01-05T09:00:00.000Z"), 0.5, "Europe/Lisbon"),
			).toBe(true);
		});

		it("converts a UTC instant into the teacher's local day/hour before matching (summer, UTC+1)", () => {
			// 2026-07-06T09:00Z is 10:00 in Lisbon in July (DST/WEST) — a slot
			// recorded as "Monday 9:00" local should NOT match this UTC instant,
			// only "Monday 10:00" should.
			const slots = [{ dayOfWeek: 1, startHour: 9, startMin: 0 }];
			expect(
				isWithinAvailability(slots, new Date("2026-07-06T09:00:00.000Z"), 0.5, "Europe/Lisbon"),
			).toBe(false);

			const shiftedSlots = [{ dayOfWeek: 1, startHour: 10, startMin: 0 }];
			expect(
				isWithinAvailability(shiftedSlots, new Date("2026-07-06T09:00:00.000Z"), 0.5, "Europe/Lisbon"),
			).toBe(true);
		});

		it("shifts the matched day of week when the timezone crosses a date boundary", () => {
			// 2026-01-05T23:30Z (Monday, late) is already 2026-01-06 08:30 in
			// Tokyo (UTC+9) — a slot recorded as "Tuesday 8:30" local should match.
			const slots = [{ dayOfWeek: 2, startHour: 8, startMin: 30 }];
			expect(
				isWithinAvailability(slots, new Date("2026-01-05T23:30:00.000Z"), 0.5, "Asia/Tokyo"),
			).toBe(true);
			// The same instant should NOT match a "Monday 8:30" slot.
			const mondaySlots = [{ dayOfWeek: 1, startHour: 8, startMin: 30 }];
			expect(
				isWithinAvailability(mondaySlots, new Date("2026-01-05T23:30:00.000Z"), 0.5, "Asia/Tokyo"),
			).toBe(false);
		});

		it("defaults to UTC when no timezone is passed, matching the pre-fix behavior", () => {
			const slots = [{ dayOfWeek: 1, startHour: 9, startMin: 0 }];
			expect(isWithinAvailability(slots, new Date("2026-01-05T09:00:00.000Z"), 0.5)).toBe(true);
		});
	});
});

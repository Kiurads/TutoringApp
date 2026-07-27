import { describe, it, expect } from "vitest";
import { applyPasswordStalenessCheck } from "./session-staleness";

describe("applyPasswordStalenessCheck", () => {
	it("leaves the token untouched when the password has never changed (both null)", () => {
		const token = { role: "student" } as never;

		const result = applyPasswordStalenessCheck(token, null);

		expect(result).toEqual(token);
		expect(result.invalidated).toBeUndefined();
	});

	it("leaves the token untouched when the DB value matches what was stamped at login", () => {
		const changedAt = 1_700_000_000_000;
		const token = { role: "student", passwordChangedAt: changedAt } as never;

		const result = applyPasswordStalenessCheck(token, changedAt);

		expect(result.invalidated).toBeUndefined();
	});

	// The bug this fix closes: a session token issued before a password
	// change kept working indefinitely, since JWT sessions have no
	// server-side revocation on their own.
	it("invalidates the token when the DB value is newer than what was stamped at login", () => {
		const token = { role: "student", passwordChangedAt: 1_700_000_000_000 } as never;

		const result = applyPasswordStalenessCheck(token, 1_800_000_000_000);

		expect(result.invalidated).toBe(true);
	});

	it("invalidates the token when the password was first ever changed after login (null -> a value)", () => {
		const token = { role: "student", passwordChangedAt: null } as never;

		const result = applyPasswordStalenessCheck(token, 1_800_000_000_000);

		expect(result.invalidated).toBe(true);
	});
});

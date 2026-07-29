import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { escalatingLockout, clearLockout } from "./rate-limit";

const WINDOW_MS = 60_000;
const LIMIT = 5;

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("escalatingLockout", () => {
	it("allows attempts up to the limit", () => {
		const key = "user1@test.com";
		for (let i = 0; i < LIMIT; i++) {
			const result = escalatingLockout(key, LIMIT, WINDOW_MS);
			expect(result.allowed).toBe(true);
		}
	});

	it("locks out once the limit is exceeded within the window", () => {
		const key = "user2@test.com";
		for (let i = 0; i < LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);

		const result = escalatingLockout(key, LIMIT, WINDOW_MS);

		expect(result.allowed).toBe(false);
		expect(result.lockoutLevel).toBe(1);
		// First lockout: windowMs * 2^1 = 120s
		expect(result.retryAfterSeconds).toBe(120);
	});

	it("stays locked out for the remainder of the lockout period even after retrying", () => {
		const key = "user3@test.com";
		for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);

		vi.advanceTimersByTime(60_000); // still within the 120s lockout
		const result = escalatingLockout(key, LIMIT, WINDOW_MS);

		expect(result.allowed).toBe(false);
	});

	// The bug this fix closes: the old flat rateLimit() always waited exactly
	// windowMs no matter how many times a key had already been exhausted —
	// sustained automated guessing was slowed but never discouraged.
	it("escalates the lockout period on each subsequent exhaustion", () => {
		const key = "user4@test.com";

		// First exhaustion → locked for 120s (level 1)
		for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);
		let result = escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(result.lockoutLevel).toBe(1);
		expect(result.retryAfterSeconds).toBe(120);

		// Serve out the lockout, then exhaust again → level 2, 240s
		vi.advanceTimersByTime(120_000);
		for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);
		result = escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(result.lockoutLevel).toBe(2);
		expect(result.retryAfterSeconds).toBe(240);
	});

	it("caps the lockout level instead of escalating forever", () => {
		const key = "user5@test.com";
		let lastResult;

		for (let level = 0; level < 10; level++) {
			for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);
			lastResult = escalatingLockout(key, LIMIT, WINDOW_MS);
			vi.advanceTimersByTime(lastResult.retryAfterSeconds * 1000);
		}

		expect(lastResult!.lockoutLevel).toBe(6);
	});

	it("clearLockout resets a key's state entirely", () => {
		const key = "user6@test.com";
		for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(escalatingLockout(key, LIMIT, WINDOW_MS).allowed).toBe(false);

		clearLockout(key);

		const result = escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(result.allowed).toBe(true);
		expect(result.lockoutLevel).toBe(0);
	});

	it("forgets the escalation level after a long period of no activity", () => {
		const key = "user7@test.com";
		for (let i = 0; i <= LIMIT; i++) escalatingLockout(key, LIMIT, WINDOW_MS);
		const locked = escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(locked.lockoutLevel).toBe(1);

		// Well past both the lockout period and the 24h decay window
		vi.advanceTimersByTime(25 * 3_600_000);

		const result = escalatingLockout(key, LIMIT, WINDOW_MS);
		expect(result.allowed).toBe(true);
		expect(result.lockoutLevel).toBe(0);
	});

	it("tracks different keys independently", () => {
		for (let i = 0; i <= LIMIT; i++) escalatingLockout("attacker@test.com", LIMIT, WINDOW_MS);

		const result = escalatingLockout("victim@test.com", LIMIT, WINDOW_MS);

		expect(result.allowed).toBe(true);
	});
});

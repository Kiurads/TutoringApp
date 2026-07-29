import { headers } from "next/headers";

// Basic in-memory rate limiter for auth entry points (login/register).
//
// NOTE: this state lives only in this process's memory.
//   - It resets on every process restart/deploy — acceptable, this is a
//     stopgap, not a security guarantee.
//   - If this app is ever horizontally scaled to more than one instance,
//     each instance tracks its own counters independently, so the
//     effective limit becomes (limit * number of instances) instead of a
//     real shared limit. That's an accepted known limitation for a
//     single-instance deploy. A multi-instance deployment needs a shared
//     store (e.g. Redis) instead of this module.
interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded over the life of
// the process — triggered occasionally rather than on every call.
function sweepExpired(now: number) {
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

let callsSinceSweep = 0;

export interface RateLimitResult {
	allowed: boolean;
	/** Seconds until the caller may retry. 0 when `allowed` is true. */
	retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiter. Returns whether `key` is still under `limit`
 * attempts within the current `windowMs` window, and increments the
 * counter for this attempt regardless of outcome.
 */
export function rateLimit(
	key: string,
	limit: number,
	windowMs: number
): RateLimitResult {
	const now = Date.now();

	callsSinceSweep += 1;
	if (callsSinceSweep >= 200) {
		callsSinceSweep = 0;
		sweepExpired(now);
	}

	const bucket = buckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	if (bucket.count >= limit) {
		return {
			allowed: false,
			retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
		};
	}

	bucket.count += 1;
	return { allowed: true, retryAfterSeconds: 0 };
}

// ── Escalating account lockout ──────────────────────────────────────────────
//
// rateLimit() above is a flat fixed window: exhaust it and you wait exactly
// windowMs, then get a fresh full allotment — the same wait every time, so
// sustained automated guessing against one account is only slowed, never
// discouraged, and per-IP limiting alone is trivially bypassed by rotating
// IPs. This tracks lockouts *per account* (keyed by email, not IP — rotating
// source IPs doesn't help an attacker against this), and each time the
// window is exhausted, the next lockout period roughly doubles.

interface LockoutState {
	attempts: number;
	windowResetAt: number;
	/** How many consecutive times this key has exhausted its window. */
	lockoutLevel: number;
	/** 0 when not currently locked. */
	lockedUntil: number;
	lastActivityAt: number;
}

const lockouts = new Map<string, LockoutState>();

const LOCKOUT_LEVEL_CAP = 6; // caps backoff at windowMs * 2^6 = 64x
// A key that's gone quiet for a day is treated as fresh — an old, resolved
// incident shouldn't permanently escalate a legitimate user's next typo.
const LOCKOUT_DECAY_MS = 24 * 3_600_000;

export interface LockoutResult {
	allowed: boolean;
	/** Seconds until the caller may retry. 0 when `allowed` is true. */
	retryAfterSeconds: number;
	lockoutLevel: number;
}

/**
 * Escalating-backoff counterpart to rateLimit(). Same fixed-window attempt
 * counting, but exhausting the window locks the key out for
 * `windowMs * 2^lockoutLevel` (capped), with the level incrementing on each
 * subsequent exhaustion instead of resetting — call clearLockout() on a
 * successful login so a legitimate user isn't penalized by their own past
 * failed attempts once they do get in.
 */
export function escalatingLockout(
	key: string,
	limit: number,
	windowMs: number
): LockoutResult {
	const now = Date.now();
	let state = lockouts.get(key);

	if (state && now - state.lastActivityAt > LOCKOUT_DECAY_MS) {
		state = undefined;
	}

	if (!state) {
		state = { attempts: 0, windowResetAt: now + windowMs, lockoutLevel: 0, lockedUntil: 0, lastActivityAt: now };
		lockouts.set(key, state);
	}

	state.lastActivityAt = now;

	if (state.lockedUntil > now) {
		return {
			allowed: false,
			retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - now) / 1000)),
			lockoutLevel: state.lockoutLevel,
		};
	}

	if (state.windowResetAt <= now) {
		// Window elapsed without ever being exhausted — reset the attempt
		// count, but the escalation level only ever clears via clearLockout()
		// (a successful login), not just the passage of time.
		state.attempts = 0;
		state.windowResetAt = now + windowMs;
	}

	state.attempts += 1;

	if (state.attempts > limit) {
		const level = Math.min(state.lockoutLevel + 1, LOCKOUT_LEVEL_CAP);
		state.lockoutLevel = level;
		const lockoutMs = windowMs * 2 ** level;
		state.lockedUntil = now + lockoutMs;
		return {
			allowed: false,
			retryAfterSeconds: Math.max(1, Math.ceil(lockoutMs / 1000)),
			lockoutLevel: level,
		};
	}

	return { allowed: true, retryAfterSeconds: 0, lockoutLevel: state.lockoutLevel };
}

/**
 * Clears a key's lockout state entirely — call on a successful login so a
 * legitimate user isn't penalized by their own earlier failed attempts.
 */
export function clearLockout(key: string): void {
	lockouts.delete(key);
}

/**
 * Best-effort client IP lookup from forwarding headers set by a reverse
 * proxy/load balancer. Falls back to "unknown" (which still rate-limits,
 * just as one shared bucket) if nothing is present — e.g. local dev
 * without a proxy in front of it.
 */
export async function getClientIp(): Promise<string> {
	const headerList = await headers();

	const forwardedFor = headerList.get("x-forwarded-for");
	if (forwardedFor) return forwardedFor.split(",")[0].trim();

	const realIp = headerList.get("x-real-ip");
	if (realIp) return realIp.trim();

	return "unknown";
}

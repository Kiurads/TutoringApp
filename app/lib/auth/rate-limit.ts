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

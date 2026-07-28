import prisma from "@/prisma";
import { expireIfNeeded } from "@/app/lib/refund-requests/expire-refund-request";

/**
 * Auto-expiry for refund requests (5 days after creation, per
 * refund-requests.actions.ts's EXPIRY_DAYS) previously only ran inside
 * expireIfNeeded, itself only ever called when a student, teacher, or admin
 * happened to fetch that specific request — a request nobody looked at
 * again could stay "pending" forever, silently never auto-refunding.
 *
 * This sweeps every past-due pending request on a schedule instead of
 * relying on it being viewed. Failures are isolated per request so one
 * broken row (e.g. a Stripe hiccup) doesn't stop the rest from expiring.
 */
export async function sweepExpiredRefundRequests(): Promise<void> {
	const stale = await prisma.refundRequest.findMany({
		where: { status: "pending", expiresAt: { lt: new Date() } },
		select: { id: true },
	});

	for (const { id } of stale) {
		try {
			await expireIfNeeded(id);
			console.log(`[worker] Auto-expired refund request ${id}.`);
		} catch (err) {
			console.error(`[worker] Error expiring refund request ${id}:`, err);
		}
	}
}

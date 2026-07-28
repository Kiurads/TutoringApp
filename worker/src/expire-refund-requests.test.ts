import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { expireIfNeeded } from "@/app/lib/refund-requests/expire-refund-request";
import { sweepExpiredRefundRequests } from "./expire-refund-requests";

vi.mock("@/prisma", () => ({
	default: {
		refundRequest: { findMany: vi.fn() },
	},
}));

vi.mock("@/app/lib/refund-requests/expire-refund-request", () => ({
	expireIfNeeded: vi.fn(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("sweepExpiredRefundRequests", () => {
	it("only queries pending requests past their expiry", async () => {
		vi.mocked(prisma.refundRequest.findMany).mockResolvedValue([]);

		await sweepExpiredRefundRequests();

		expect(prisma.refundRequest.findMany).toHaveBeenCalledWith({
			where: { status: "pending", expiresAt: { lt: expect.any(Date) } },
			select: { id: true },
		});
	});

	it("does nothing when no requests are past due", async () => {
		vi.mocked(prisma.refundRequest.findMany).mockResolvedValue([]);

		await sweepExpiredRefundRequests();

		expect(expireIfNeeded).not.toHaveBeenCalled();
	});

	it("expires every past-due request found", async () => {
		vi.mocked(prisma.refundRequest.findMany).mockResolvedValue([
			{ id: "req1" },
			{ id: "req2" },
		] as never);

		await sweepExpiredRefundRequests();

		expect(expireIfNeeded).toHaveBeenCalledWith("req1");
		expect(expireIfNeeded).toHaveBeenCalledWith("req2");
	});

	// The bug this fix closes: auto-expiry only ran when a request happened
	// to be fetched for viewing — nothing swept stale ones on a schedule.
	it("isolates failures per request so one broken row doesn't stop the rest", async () => {
		vi.mocked(prisma.refundRequest.findMany).mockResolvedValue([
			{ id: "req1" },
			{ id: "req2" },
		] as never);
		vi.mocked(expireIfNeeded)
			.mockRejectedValueOnce(new Error("Stripe hiccup"))
			.mockResolvedValueOnce(undefined);

		await expect(sweepExpiredRefundRequests()).resolves.not.toThrow();

		expect(expireIfNeeded).toHaveBeenCalledWith("req1");
		expect(expireIfNeeded).toHaveBeenCalledWith("req2");
	});
});

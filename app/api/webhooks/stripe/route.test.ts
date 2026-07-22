import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { createPaymentForClass } from "@/app/lib/actions/paymets.actions";
import { sendDisputeAlertEmail } from "@/app/lib/email";
import { POST } from "./route";

// vi.hoisted ensures these are available inside vi.mock factory functions
const { mockConstructEvent } = vi.hoisted(() => ({
	mockConstructEvent: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
	default: class MockStripe {
		webhooks = { constructEvent: mockConstructEvent };
	},
}));

vi.mock("@/prisma", () => ({
	default: {
		payment: { findFirst: vi.fn() },
		user: { findMany: vi.fn() },
	},
}));

vi.mock("@/app/lib/actions/paymets.actions", () => ({
	createPaymentForClass: vi.fn(),
}));

vi.mock("@/app/lib/email", () => ({
	sendDisputeAlertEmail: vi.fn(),
}));

function makeRequest(body: string) {
	return new Request("http://localhost/api/webhooks/stripe", {
		method: "POST",
		headers: { "stripe-signature": "sig_test" },
		body,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("POST /api/webhooks/stripe", () => {
	it("returns 400 when signature verification fails", async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error("bad signature");
		});

		const res = await POST(makeRequest("{}"));

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toContain("bad signature");
	});

	it("creates a Payment for payment_intent.succeeded when none exists yet", async () => {
		mockConstructEvent.mockReturnValue({
			type: "payment_intent.succeeded",
			data: { object: { id: "pi_1", metadata: { classId: "class_1" } } },
		});
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

		const res = await POST(makeRequest("{}"));

		expect(createPaymentForClass).toHaveBeenCalledWith("class_1", "pi_1");
		expect(res.status).toBe(200);
	});

	it("does not double-create a Payment for payment_intent.succeeded when one already exists", async () => {
		mockConstructEvent.mockReturnValue({
			type: "payment_intent.succeeded",
			data: { object: { id: "pi_1", metadata: { classId: "class_1" } } },
		});
		vi.mocked(prisma.payment.findFirst).mockResolvedValue({ id: "pay_1" } as never);

		await POST(makeRequest("{}"));

		expect(createPaymentForClass).not.toHaveBeenCalled();
	});

	it("logs payment_intent.payment_failed without throwing", async () => {
		mockConstructEvent.mockReturnValue({
			type: "payment_intent.payment_failed",
			data: {
				object: {
					id: "pi_2",
					metadata: { classId: "class_2" },
					last_payment_error: { message: "card declined" },
				},
			},
		});

		const res = await POST(makeRequest("{}"));

		expect(res.status).toBe(200);
	});

	it("logs payment_intent.canceled without throwing", async () => {
		mockConstructEvent.mockReturnValue({
			type: "payment_intent.canceled",
			data: {
				object: { id: "pi_3", metadata: {}, cancellation_reason: "expired" },
			},
		});

		const res = await POST(makeRequest("{}"));

		expect(res.status).toBe(200);
	});

	it("logs charge.refunded without throwing", async () => {
		mockConstructEvent.mockReturnValue({
			type: "charge.refunded",
			data: {
				object: { id: "ch_1", payment_intent: "pi_4", amount_refunded: 5000 },
			},
		});

		const res = await POST(makeRequest("{}"));

		expect(res.status).toBe(200);
	});

	it("emails every admin on charge.dispute.created", async () => {
		mockConstructEvent.mockReturnValue({
			type: "charge.dispute.created",
			data: {
				object: {
					id: "dp_1",
					payment_intent: "pi_5",
					reason: "fraudulent",
					amount: 10000,
				},
			},
		});
		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{ email: "admin1@test.com" },
			{ email: "admin2@test.com" },
		] as never);

		const res = await POST(makeRequest("{}"));

		expect(prisma.user.findMany).toHaveBeenCalledWith({
			where: { role: "admin" },
			select: { email: true },
		});
		expect(sendDisputeAlertEmail).toHaveBeenCalledTimes(2);
		expect(sendDisputeAlertEmail).toHaveBeenCalledWith("admin1@test.com", {
			disputeId: "dp_1",
			paymentIntentId: "pi_5",
			reason: "fraudulent",
			amount: 10000,
		});
		expect(res.status).toBe(200);
	});

	it("ignores unhandled event types", async () => {
		mockConstructEvent.mockReturnValue({
			type: "customer.created",
			data: { object: {} },
		});

		const res = await POST(makeRequest("{}"));

		expect(res.status).toBe(200);
		expect(createPaymentForClass).not.toHaveBeenCalled();
		expect(sendDisputeAlertEmail).not.toHaveBeenCalled();
	});
});

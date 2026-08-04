import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { saveDefaultPaymentMethod, getPaymentMethodStatus } from "./payment-methods.actions";

const { mockSetupIntentsRetrieve } = vi.hoisted(() => ({
	mockSetupIntentsRetrieve: vi.fn(),
}));

vi.mock("@/app/lib/stripe", () => ({
	getStripe: vi.fn(() => ({
		setupIntents: { retrieve: mockSetupIntentsRetrieve },
	})),
}));

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn(), update: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("saveDefaultPaymentMethod", () => {
	it("rejects when there is no session", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await saveDefaultPaymentMethod("seti_123");

		expect(result).toEqual({ error: "Not authenticated." });
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects when the user has no Stripe customer profile yet", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			stripeCustomerId: null,
		} as never);

		const result = await saveDefaultPaymentMethod("seti_123");

		expect(result).toEqual({ error: "No payment profile found." });
	});

	it("rejects when the SetupIntent belongs to a different customer", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			stripeCustomerId: "cus_mine",
		} as never);
		mockSetupIntentsRetrieve.mockResolvedValue({
			customer: "cus_someone_else",
			status: "succeeded",
			payment_method: "pm_123",
		});

		const result = await saveDefaultPaymentMethod("seti_123");

		expect(result).toEqual({ error: "This payment method does not belong to your account." });
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects when the SetupIntent has not succeeded", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			stripeCustomerId: "cus_mine",
		} as never);
		mockSetupIntentsRetrieve.mockResolvedValue({
			customer: "cus_mine",
			status: "requires_action",
			payment_method: null,
		});

		const result = await saveDefaultPaymentMethod("seti_123");

		expect(result).toEqual({ error: "Card setup was not completed." });
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("saves the payment method on success", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			stripeCustomerId: "cus_mine",
		} as never);
		mockSetupIntentsRetrieve.mockResolvedValue({
			customer: "cus_mine",
			status: "succeeded",
			payment_method: "pm_123",
		});
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);

		const result = await saveDefaultPaymentMethod("seti_123");

		expect(result).toEqual({});
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "student1" },
			data: { defaultPaymentMethodId: "pm_123" },
		});
	});
});

describe("getPaymentMethodStatus", () => {
	it("returns false when there is no session", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await getPaymentMethodStatus();

		expect(result).toEqual({ hasPaymentMethod: false });
	});

	it("returns true when the user has a saved default payment method", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			defaultPaymentMethodId: "pm_123",
		} as never);

		const result = await getPaymentMethodStatus();

		expect(result).toEqual({ hasPaymentMethod: true });
	});

	it("returns false when the user has no saved payment method", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			defaultPaymentMethodId: null,
		} as never);

		const result = await getPaymentMethodStatus();

		expect(result).toEqual({ hasPaymentMethod: false });
	});
});

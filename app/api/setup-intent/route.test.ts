import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { POST } from "./route";

const { mockCustomersCreate, mockSetupIntentsCreate } = vi.hoisted(() => ({
	mockCustomersCreate: vi.fn(),
	mockSetupIntentsCreate: vi.fn(),
}));

vi.mock("@/app/lib/stripe", () => ({
	getStripe: vi.fn(() => ({
		customers: { create: mockCustomersCreate },
		setupIntents: { create: mockSetupIntentsCreate },
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

describe("POST /api/setup-intent", () => {
	it("returns 401 when there is no session", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const response = await POST();

		expect(response.status).toBe(401);
	});

	it("reuses an existing Stripe customer instead of creating a new one", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			email: "s@test.com",
			stripeCustomerId: "cus_existing",
		} as never);
		mockSetupIntentsCreate.mockResolvedValue({ client_secret: "seti_secret_abc" });

		const response = await POST();
		const json = await response.json();

		expect(mockCustomersCreate).not.toHaveBeenCalled();
		expect(mockSetupIntentsCreate).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_existing" }),
		);
		expect(json).toEqual({ clientSecret: "seti_secret_abc" });
	});

	it("creates and persists a new Stripe customer when the user has none yet", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "student1",
			email: "s@test.com",
			stripeCustomerId: null,
		} as never);
		mockCustomersCreate.mockResolvedValue({ id: "cus_new" });
		mockSetupIntentsCreate.mockResolvedValue({ client_secret: "seti_secret_abc" });
		vi.mocked(prisma.user.update).mockResolvedValue({} as never);

		await POST();

		expect(mockCustomersCreate).toHaveBeenCalledWith(
			expect.objectContaining({ email: "s@test.com" }),
		);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "student1" },
			data: { stripeCustomerId: "cus_new" },
		});
		expect(mockSetupIntentsCreate).toHaveBeenCalledWith(
			expect.objectContaining({ customer: "cus_new" }),
		);
	});
});

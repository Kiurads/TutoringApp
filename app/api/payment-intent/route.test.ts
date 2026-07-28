import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { getStripe } from "@/app/lib/stripe";
import { POST } from "./route";

const { mockPaymentIntentsCreate } = vi.hoisted(() => ({
	mockPaymentIntentsCreate: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/actions/classes.actions", () => ({ fetchClassById: vi.fn() }));
vi.mock("@/app/lib/stripe", () => ({
	getStripe: vi.fn(() => ({
		paymentIntents: { create: mockPaymentIntentsCreate },
	})),
}));

const mockSession = { user: { email: "student@test.com" } };

function makeRequest(body: unknown) {
	return new Request("http://localhost/api/payment-intent", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("POST /api/payment-intent", () => {
	it("returns 401 when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const response = await POST(makeRequest({ classId: "class1" }));

		expect(response.status).toBe(401);
		expect(fetchClassById).not.toHaveBeenCalled();
	});

	it("returns 404 when the class does not exist", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchClassById).mockResolvedValue(null);

		const response = await POST(makeRequest({ classId: "class1" }));

		expect(response.status).toBe(404);
		expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
	});

	it("returns 404 when the class has no price", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchClassById).mockResolvedValue({ id: "class1", totalPrice: "" } as never);

		const response = await POST(makeRequest({ classId: "class1" }));

		expect(response.status).toBe(404);
	});

	it("creates a payment intent for the class's price in cents", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchClassById).mockResolvedValue({ id: "class1", totalPrice: "45.50" } as never);
		mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "secret_abc" });

		const response = await POST(makeRequest({ classId: "class1" }));
		const body = await response.json();

		expect(getStripe).toHaveBeenCalled();
		expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
			amount: 4550,
			currency: "eur",
			metadata: { classId: "class1" },
		});
		expect(body).toEqual({ clientSecret: "secret_abc" });
	});

	it("rounds fractional cents to the nearest whole cent", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchClassById).mockResolvedValue({ id: "class1", totalPrice: "10.005" } as never);
		mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "secret_abc" });

		await POST(makeRequest({ classId: "class1" }));

		expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
			expect.objectContaining({ amount: 1001 }),
		);
	});
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { POST } from "./route";

const { mockPaymentIntentsCreate } = vi.hoisted(() => ({
	mockPaymentIntentsCreate: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
	default: class MockStripe {
		paymentIntents = { create: mockPaymentIntentsCreate };
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn() },
		teacherAvailability: { findMany: vi.fn() },
	},
}));

const mockSession = { user: { email: "student@test.com" } };

// Saturday 10:00 local — arbitrary fixed slot used across tests
const START_TIME = "2026-05-02T10:00:00";

function makeRequest(body: unknown) {
	return new Request("http://localhost/api/payment-intent/pre-auth", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([]);
	vi.mocked(prisma.user.findUnique).mockImplementation(((args: { where: { id?: string; email?: string } }) => {
		if (args.where.id === "teacher1") {
			return Promise.resolve({ pricePerHour: 20, firstName: "Alice", lastName: "Smith" } as never);
		}
		if (args.where.email === "student@test.com") {
			return Promise.resolve({ studentGameProfile: { studyBoostActive: false } } as never);
		}
		return Promise.resolve(null);
	}) as never);
});

describe("POST /api/payment-intent/pre-auth", () => {
	it("returns 401 when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const response = await POST(
			makeRequest({ teacherId: "teacher1", durationInHours: 1, startTime: START_TIME }),
		);

		expect(response.status).toBe(401);
	});

	it("returns 400 when required fields are missing", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);

		const response = await POST(makeRequest({ teacherId: "teacher1" }));

		expect(response.status).toBe(400);
		expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
	});

	it("returns 404 when the teacher or their price is not found", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const response = await POST(
			makeRequest({ teacherId: "teacher1", durationInHours: 1, startTime: START_TIME }),
		);

		expect(response.status).toBe(404);
	});

	it("returns 422 when the requested time is outside the teacher's availability", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([
			{ dayOfWeek: 1, startHour: 9, startMin: 0 },
		] as never);

		// START_TIME is a Saturday — won't match a Monday (dayOfWeek: 1) slot
		const response = await POST(
			makeRequest({ teacherId: "teacher1", durationInHours: 1, startTime: START_TIME }),
		);

		expect(response.status).toBe(422);
		expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
	});

	it("creates a manual-capture payment intent priced from the teacher's rate and duration", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "secret_abc", id: "pi_123" });

		const response = await POST(
			makeRequest({ teacherId: "teacher1", durationInHours: 2, startTime: START_TIME }),
		);
		const body = await response.json();

		expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
			amount: 4000,
			currency: "eur",
			capture_method: "manual",
			metadata: {
				teacherId: "teacher1",
				durationInHours: "2",
				createdByEmail: "student@test.com",
				studyBoostApplied: "false",
			},
		});
		expect(body).toEqual({
			clientSecret: "secret_abc",
			intentId: "pi_123",
			totalPrice: 40,
			studyBoostApplied: false,
		});
	});

	it("applies the Study Boost discount when active for the student", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique).mockImplementation(((args: { where: { id?: string; email?: string } }) => {
			if (args.where.id === "teacher1") {
				return Promise.resolve({ pricePerHour: 20, firstName: "Alice", lastName: "Smith" } as never);
			}
			return Promise.resolve({ studentGameProfile: { studyBoostActive: true } } as never);
		}) as never);
		mockPaymentIntentsCreate.mockResolvedValue({ client_secret: "secret_abc", id: "pi_123" });

		const response = await POST(
			makeRequest({ teacherId: "teacher1", durationInHours: 1, startTime: START_TIME }),
		);
		const body = await response.json();

		// 20 * 1 * 0.95 = 19
		expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
			expect.objectContaining({ amount: 1900 }),
		);
		expect(body.studyBoostApplied).toBe(true);
		expect(body.totalPrice).toBe(19);
	});
});

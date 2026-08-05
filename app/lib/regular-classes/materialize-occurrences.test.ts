import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { materializeOccurrences } from "./materialize-occurrences";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

// vi.hoisted ensures these are available inside vi.mock factory functions
const { mockPaymentIntentsCreate } = vi.hoisted(() => ({
	mockPaymentIntentsCreate: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
	default: class MockStripe {
		paymentIntents = { create: mockPaymentIntentsCreate };
	},
}));

vi.mock("@/prisma", () => ({
	default: {
		regularClass: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		class: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		payment: {
			create: vi.fn(),
		},
	},
}));

vi.mock("@/app/lib/classes/generate-jitsi-room", () => ({
	generateJitsiRoom: () => "learning-nexus-test-room",
}));

vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

const baseRegularClass = {
	id: "rc1",
	studentId: "student1",
	teacherId: "teacher1",
	subjectId: "sub1",
	dayOfWeek: new Date().getDay(), // guaranteed to occur within any 4-week window
	startTime: new Date("2026-01-01T14:30:00.000Z"),
	durationInHours: dec(1),
	totalPrice: dec(20),
	status: "active",
	lastMaterializedThrough: null,
	student: { stripeCustomerId: null, defaultPaymentMethodId: null },
};

const withPaymentMethod = {
	...baseRegularClass,
	student: { stripeCustomerId: "cus_test", defaultPaymentMethodId: "pm_test" },
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(prisma.class.create).mockResolvedValue({ id: "occ1" } as never);
	vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);
});

describe("materializeOccurrences", () => {
	it("returns 0 and does nothing when the regular class is not found", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(null);

		const result = await materializeOccurrences("rc1");

		expect(result).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
		expect(prisma.regularClass.update).not.toHaveBeenCalled();
	});

	it("returns 0 and does nothing when the series is not active", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			...baseRegularClass,
			status: "requested",
		} as never);

		const result = await materializeOccurrences("rc1");

		expect(result).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
	});

	it("creates unpaid occurrences and notifies the student when no payment method is on file", async () => {
		const { createNotification } = await import("@/app/lib/notifications");
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(baseRegularClass as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null); // nothing exists yet

		const created = await materializeOccurrences("rc1");

		// A 4-week rolling window on a weekly cadence always yields at least 4 matches
		expect(created).toBeGreaterThanOrEqual(4);
		expect(prisma.class.create).toHaveBeenCalledTimes(created);
		expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
		expect(prisma.payment.create).not.toHaveBeenCalled();
		expect(prisma.class.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					studentId: "student1",
					teacherId: "teacher1",
					subjectId: "sub1",
					status: "scheduled",
					requesterId: "student1",
					regularClassId: "rc1",
					jitsiRoom: "learning-nexus-test-room",
					totalPrice: baseRegularClass.totalPrice,
				}),
			}),
		);
		expect(prisma.class.create).not.toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ paid: true }) }),
		);
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"regular_class_payment_failed",
			"Payment Method Needed",
			expect.any(String),
			"/main/student/classes/occ1",
		);
	});

	it("charges the saved card and records a paid Payment when a payment method is on file", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(withPaymentMethod as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null);
		mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_123" });
		vi.mocked(prisma.payment.create).mockResolvedValue({} as never);

		const created = await materializeOccurrences("rc1");

		expect(created).toBeGreaterThanOrEqual(4);
		expect(mockPaymentIntentsCreate).toHaveBeenCalledTimes(created);
		expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 2000,
				currency: "eur",
				customer: "cus_test",
				payment_method: "pm_test",
				off_session: true,
				confirm: true,
			}),
		);
		expect(prisma.class.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ paid: true }) }),
		);
		expect(prisma.payment.create).toHaveBeenCalledTimes(created);
		expect(prisma.payment.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					amount: 20,
					intentId: "pi_test_123",
					classId: "occ1",
					studentId: "student1",
					teacherId: "teacher1",
					platformFeeRateBps: 1500,
				}),
			}),
		);
	});

	it("creates an unpaid occurrence and notifies the student when the off-session charge fails", async () => {
		const { createNotification } = await import("@/app/lib/notifications");
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(withPaymentMethod as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null);
		mockPaymentIntentsCreate.mockRejectedValue(new Error("Card declined"));

		const created = await materializeOccurrences("rc1");

		expect(created).toBeGreaterThanOrEqual(4);
		expect(prisma.payment.create).not.toHaveBeenCalled();
		expect(prisma.class.create).not.toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ paid: true }) }),
		);
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"regular_class_payment_failed",
			"Payment Failed",
			expect.stringContaining("Card declined"),
			"/main/student/classes/occ1",
		);
	});

	it("notifies with regular_class_requires_action when the off-session charge is declined for SCA authentication", async () => {
		const { createNotification } = await import("@/app/lib/notifications");
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(withPaymentMethod as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null);
		mockPaymentIntentsCreate.mockRejectedValue({
			code: "authentication_required",
			message: "This payment requires authentication.",
			payment_intent: { id: "pi_requires_action" },
		});

		const created = await materializeOccurrences("rc1");

		expect(created).toBeGreaterThanOrEqual(4);
		expect(prisma.payment.create).not.toHaveBeenCalled();
		expect(prisma.class.create).not.toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ paid: true }) }),
		);
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"regular_class_requires_action",
			"Payment Needs Your Confirmation",
			expect.any(String),
			"/main/student/classes/occ1",
		);
		expect(createNotification).not.toHaveBeenCalledWith(
			"student1",
			"regular_class_payment_failed",
			expect.anything(),
			expect.anything(),
			expect.anything(),
		);
	});

	it("does not recreate occurrences that already exist", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(baseRegularClass as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: "existing" } as never);

		const created = await materializeOccurrences("rc1");

		expect(created).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
		// Watermark still advances even when nothing new was created
		expect(prisma.regularClass.update).toHaveBeenCalled();
	});

	it("never moves the watermark backward", async () => {
		const farFuture = new Date(Date.now() + 10 * 7 * 24 * 3_600_000); // 10 weeks out
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			...baseRegularClass,
			lastMaterializedThrough: farFuture,
		} as never);

		await materializeOccurrences("rc1");

		expect(prisma.class.create).not.toHaveBeenCalled();
		expect(prisma.regularClass.update).toHaveBeenCalledWith({
			where: { id: "rc1" },
			data: { lastMaterializedThrough: farFuture },
		});
	});
});

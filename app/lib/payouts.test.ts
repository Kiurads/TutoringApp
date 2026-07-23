import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { createNotification } from "@/app/lib/notifications";
import { transferPayoutForClass, transferPendingPayoutsForTeacher } from "./payouts";

const { mockTransferCreate } = vi.hoisted(() => ({
	mockTransferCreate: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
	default: class MockStripe {
		transfers = { create: mockTransferCreate };
	},
}));

vi.mock("@/prisma", () => ({
	default: {
		payment: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			updateMany: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/app/lib/notifications", () => ({
	createNotification: vi.fn(),
}));

function mockPayment(overrides: Record<string, unknown> = {}) {
	return {
		id: "pay_1",
		teacherId: "teacher_1",
		teacherPayoutAmount: 85,
		payoutStatus: "not_applicable",
		teacher: {
			id: "teacher_1",
			stripeConnectAccountId: "acct_1",
			connectPayoutsEnabled: true,
		},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("transferPayoutForClass", () => {
	it("no-ops when no Payment exists for the class", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

		await transferPayoutForClass("class_1");

		expect(mockTransferCreate).not.toHaveBeenCalled();
	});

	it("no-ops when the payout was already transferred", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(
			mockPayment({ payoutStatus: "transferred" }) as never,
		);

		await transferPayoutForClass("class_1");

		expect(mockTransferCreate).not.toHaveBeenCalled();
		expect(prisma.payment.updateMany).not.toHaveBeenCalled();
	});

	it("accrues as pending when the teacher has no Connect account", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(
			mockPayment({ teacher: { id: "teacher_1", stripeConnectAccountId: null, connectPayoutsEnabled: false } }) as never,
		);

		await transferPayoutForClass("class_1");

		expect(prisma.payment.updateMany).toHaveBeenCalledWith({
			where: { id: "pay_1", payoutStatus: { not: "transferred" } },
			data: { payoutStatus: "pending" },
		});
		expect(mockTransferCreate).not.toHaveBeenCalled();
	});

	it("accrues as pending when connectPayoutsEnabled is false even with an account id", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(
			mockPayment({ teacher: { id: "teacher_1", stripeConnectAccountId: "acct_1", connectPayoutsEnabled: false } }) as never,
		);

		await transferPayoutForClass("class_1");

		expect(prisma.payment.updateMany).toHaveBeenCalledWith({
			where: { id: "pay_1", payoutStatus: { not: "transferred" } },
			data: { payoutStatus: "pending" },
		});
		expect(mockTransferCreate).not.toHaveBeenCalled();
	});

	it("transfers the payout and records success on the happy path", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment() as never);
		vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 } as never);
		mockTransferCreate.mockResolvedValue({ id: "tr_1" });

		await transferPayoutForClass("class_1");

		expect(prisma.payment.updateMany).toHaveBeenCalledWith({
			where: { id: "pay_1", payoutStatus: { in: ["not_applicable", "pending", "failed"] } },
			data: { payoutAttemptedAt: expect.any(Date) },
		});
		expect(mockTransferCreate).toHaveBeenCalledWith({
			amount: 8500,
			currency: "eur",
			destination: "acct_1",
			transfer_group: "class_class_1",
			metadata: { classId: "class_1", paymentId: "pay_1" },
		});
		expect(prisma.payment.update).toHaveBeenCalledWith({
			where: { id: "pay_1" },
			data: { payoutStatus: "transferred", transferId: "tr_1" },
		});
		expect(createNotification).toHaveBeenCalledWith(
			"teacher_1",
			"payout_sent",
			"Payout Sent",
			expect.stringContaining("85.00"),
			"/main/teacher/payouts",
		);
	});

	it("does not call Stripe when the claiming updateMany affects no rows (lost the race)", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment() as never);
		vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 0 } as never);

		await transferPayoutForClass("class_1");

		expect(mockTransferCreate).not.toHaveBeenCalled();
	});

	it("records failure without throwing when Stripe errors", async () => {
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment() as never);
		vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 } as never);
		mockTransferCreate.mockRejectedValue(new Error("insufficient balance"));

		await expect(transferPayoutForClass("class_1")).resolves.toBeUndefined();

		expect(prisma.payment.update).toHaveBeenCalledWith({
			where: { id: "pay_1" },
			data: { payoutStatus: "failed", payoutError: "insufficient balance" },
		});
	});
});

describe("transferPendingPayoutsForTeacher", () => {
	it("attempts a transfer for every pending/failed payment", async () => {
		vi.mocked(prisma.payment.findMany).mockResolvedValue([
			{ classId: "class_1" },
			{ classId: "class_2" },
		] as never);
		vi.mocked(prisma.payment.findFirst).mockResolvedValue(null); // short-circuit each call

		await transferPendingPayoutsForTeacher("teacher_1");

		expect(prisma.payment.findMany).toHaveBeenCalledWith({
			where: { teacherId: "teacher_1", payoutStatus: { in: ["pending", "failed"] } },
			select: { classId: true },
		});
		expect(prisma.payment.findFirst).toHaveBeenCalledTimes(2);
	});
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { startConnectOnboarding, getConnectStatus, retryFailedPayout } from "./payouts.actions";

const { mockAccountsCreate, mockAccountLinksCreate } = vi.hoisted(() => ({
	mockAccountsCreate: vi.fn(),
	mockAccountLinksCreate: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
	default: class MockStripe {
		accounts = { create: mockAccountsCreate };
		accountLinks = { create: mockAccountLinksCreate };
	},
}));

vi.mock("@/app/lib/stripe", () => ({
	getStripe: vi.fn(() => ({
		accounts: { create: mockAccountsCreate },
		accountLinks: { create: mockAccountLinksCreate },
	})),
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/prisma", () => ({
	default: {
		user: { update: vi.fn() },
		payment: { findUnique: vi.fn() },
	},
}));

vi.mock("@/app/lib/actions/users.actions", () => ({
	fetchUserByEmail: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ensureConnectAccount is deliberately left real here (it runs against the
// already-mocked Stripe/prisma above) — only transferPayoutForClass is
// swapped out, since retryFailedPayout's tests just need to assert it was
// called, not exercise its own internals (covered in payouts.test.ts).
const { mockTransferPayoutForClass } = vi.hoisted(() => ({
	mockTransferPayoutForClass: vi.fn(),
}));
vi.mock("@/app/lib/payouts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/app/lib/payouts")>();
	return {
		...actual,
		transferPayoutForClass: mockTransferPayoutForClass,
	};
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe("startConnectOnboarding", () => {
	it("rejects unauthenticated requests", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await startConnectOnboarding();

		expect(result).toEqual({ error: "Not authenticated." });
		expect(mockAccountsCreate).not.toHaveBeenCalled();
	});

	it("rejects non-teachers", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "student@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "s1", role: "student" } as never);

		const result = await startConnectOnboarding();

		expect(result).toEqual({ error: "Only teachers can set up payouts." });
		expect(mockAccountsCreate).not.toHaveBeenCalled();
	});

	it("creates a new Stripe account for a first-time teacher and returns an onboarding link", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({
			id: "t1",
			email: "teacher@test.com",
			role: "teacher",
			stripeConnectAccountId: null,
		} as never);
		mockAccountsCreate.mockResolvedValue({ id: "acct_new" });
		mockAccountLinksCreate.mockResolvedValue({ url: "https://connect.stripe.com/setup/acct_new" });

		const result = await startConnectOnboarding();

		expect(mockAccountsCreate).toHaveBeenCalledWith(
			expect.objectContaining({ type: "express", email: "teacher@test.com" }),
		);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "t1" },
			data: { stripeConnectAccountId: "acct_new", connectStatus: "pending" },
		});
		expect(mockAccountLinksCreate).toHaveBeenCalledWith(
			expect.objectContaining({ account: "acct_new", type: "account_onboarding" }),
		);
		expect(result).toEqual({ url: "https://connect.stripe.com/setup/acct_new" });
	});

	it("reuses an existing account id and only generates a fresh link", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({
			id: "t1",
			email: "teacher@test.com",
			role: "teacher",
			stripeConnectAccountId: "acct_existing",
		} as never);
		mockAccountLinksCreate.mockResolvedValue({ url: "https://connect.stripe.com/setup/acct_existing" });

		await startConnectOnboarding();

		expect(mockAccountsCreate).not.toHaveBeenCalled();
		expect(prisma.user.update).not.toHaveBeenCalled();
		expect(mockAccountLinksCreate).toHaveBeenCalledWith(
			expect.objectContaining({ account: "acct_existing" }),
		);
	});

	it("returns a friendly error instead of throwing when Stripe rejects the request", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({
			id: "t1",
			email: "teacher@test.com",
			role: "teacher",
			stripeConnectAccountId: null,
		} as never);
		mockAccountsCreate.mockRejectedValue(
			new Error("You can only create new accounts if you've signed up for Connect."),
		);

		const result = await startConnectOnboarding();

		expect(result).toEqual({ error: "Couldn't start payout setup. Please try again shortly." });
		expect(prisma.user.update).not.toHaveBeenCalled();
	});
});

describe("getConnectStatus", () => {
	it("rejects unauthenticated requests", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await getConnectStatus();

		expect(result).toEqual({ error: "Not authenticated." });
	});

	it("returns the teacher's current Connect status fields", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({
			id: "t1",
			role: "teacher",
			stripeConnectAccountId: "acct_1",
			connectStatus: "active",
			connectChargesEnabled: true,
			connectPayoutsEnabled: true,
			connectDetailsSubmitted: true,
		} as never);

		const result = await getConnectStatus();

		expect(result).toEqual({
			hasAccount: true,
			connectStatus: "active",
			connectChargesEnabled: true,
			connectPayoutsEnabled: true,
			connectDetailsSubmitted: true,
		});
	});
});

describe("retryFailedPayout", () => {
	it("rejects unauthenticated requests", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await retryFailedPayout("pay1");

		expect(result).toEqual({ error: "Not authenticated." });
		expect(mockTransferPayoutForClass).not.toHaveBeenCalled();
	});

	it("rejects non-admins", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1", role: "teacher" } as never);

		const result = await retryFailedPayout("pay1");

		expect(result).toEqual({ error: "Not authorized." });
		expect(mockTransferPayoutForClass).not.toHaveBeenCalled();
	});

	it("returns an error when the payment doesn't exist", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "admin@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "a1", role: "admin" } as never);
		vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

		const result = await retryFailedPayout("pay1");

		expect(result).toEqual({ error: "Payment not found." });
		expect(mockTransferPayoutForClass).not.toHaveBeenCalled();
	});

	it("rejects retrying a payout that isn't currently failed", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "admin@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "a1", role: "admin" } as never);
		vi.mocked(prisma.payment.findUnique).mockResolvedValue({
			classId: "class1",
			payoutStatus: "transferred",
		} as never);

		const result = await retryFailedPayout("pay1");

		expect(result).toEqual({ error: "Only failed payouts can be retried." });
		expect(mockTransferPayoutForClass).not.toHaveBeenCalled();
	});

	it("retries the transfer and revalidates the admin payments page", async () => {
		const { revalidatePath } = await import("next/cache");
		vi.mocked(auth).mockResolvedValue({ user: { email: "admin@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "a1", role: "admin" } as never);
		vi.mocked(prisma.payment.findUnique).mockResolvedValue({
			classId: "class1",
			payoutStatus: "failed",
		} as never);

		const result = await retryFailedPayout("pay1");

		expect(mockTransferPayoutForClass).toHaveBeenCalledWith("class1");
		expect(revalidatePath).toHaveBeenCalledWith("/en/main/admin/payments");
		expect(revalidatePath).toHaveBeenCalledWith("/pt/main/admin/payments");
		expect(result).toEqual({});
	});
});

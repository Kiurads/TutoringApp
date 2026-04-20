import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import { createPaymentForClass } from "./paymets.actions";
import { cancelClassById } from "./classes.actions";
import { createNotification } from "@/app/lib/notifications";

// ─── Stripe mock ──────────────────────────────────────────────────────────────
// vi.hoisted ensures these are available inside vi.mock factory functions
const { mockRefundsCreate } = vi.hoisted(() => ({
  mockRefundsCreate: vi.fn(),
}));

// Stripe must be mocked as a class (constructor) — arrow functions cannot be called with `new`
vi.mock("stripe", () => ({
  default: class MockStripe {
    refunds = { create: mockRefundsCreate };
  },
}));

// ─── Infrastructure mocks ─────────────────────────────────────────────────────
vi.mock("@/prisma", () => ({
  default: {
    class: {
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dec = (n: number) => ({
  toNumber: () => n,
  toFixed: (d: number) => n.toFixed(d),
  toString: () => String(n),
});

const mockSession = { user: { email: "user@test.com" } };

/** A minimal class row as returned by prisma.class.findFirst (used by createPaymentForClass) */
const makeClassRow = (overrides: Record<string, unknown> = {}) => ({
  id: "class1",
  status: "scheduled",
  startTime: new Date("2026-06-01T10:00:00Z"),
  totalPrice: dec(45),
  paid: false,
  teacherId: "teacher1",
  studentId: "student1",
  student: { id: "student1", firstName: "Ana",   lastName: "Lima",  email: "ana@test.com"   },
  teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith", email: "alice@test.com" },
  subject: { name: "Math" },
  ...overrides,
});

/** A class row as returned by prisma.class.findUnique (used by cancelClassById, includes payments) */
const makeCancelClassRow = (overrides: Record<string, unknown> = {}) => ({
  id: "class1",
  status: "scheduled",
  paid: false,
  teacherId: "teacher1",
  studentId: "student1",
  student: { id: "student1", firstName: "Ana",   lastName: "Lima"  },
  teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
  subject: { name: "Math" },
  payments: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// createPaymentForClass
// ═══════════════════════════════════════════════════════════════════════════════
describe("createPaymentForClass", () => {
  it("returns null when the class is not found", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

    const result = await createPaymentForClass("class1", "pi_test_123");

    expect(result).toBeNull();
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("returns null when the class has no teacher (broadcast not yet claimed)", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(
      makeClassRow({ teacherId: null, teacher: null }) as never,
    );

    const result = await createPaymentForClass("class1", "pi_test_123");

    expect(result).toBeNull();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("creates a payment record with the correct data", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(makeClassRow() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({} as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await createPaymentForClass("class1", "pi_test_abc");

    // amount is a Prisma Decimal mock — check the other fields, skip deep-equal on amount
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        classId:   "class1",
        studentId: "student1",
        teacherId: "teacher1",
        intentId:  "pi_test_abc",
        amount:    expect.objectContaining({ toNumber: expect.any(Function) }),
      }),
    });
  });

  it("marks the class as paid", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(makeClassRow() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({} as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await createPaymentForClass("class1", "pi_test_abc");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data:  { paid: true },
    });
  });

  it("notifies the teacher after payment", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(makeClassRow() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({} as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await createPaymentForClass("class1", "pi_test_abc");

    expect(createNotification).toHaveBeenCalledWith(
      "teacher1",
      "class_paid",
      "Payment Received",
      expect.stringContaining("45.00€"),
      "/main/teacher/earnings",
    );
  });

  it("returns the formatted class details on success", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(makeClassRow() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({} as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    const result = await createPaymentForClass("class1", "pi_test_abc");

    expect(result).toMatchObject({
      student: { name: "Ana Lima" },
      teacher: { name: "Alice Smith" },
      subject: { name: "Math" },
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// cancelClassById — Stripe refund behaviour
// ═══════════════════════════════════════════════════════════════════════════════
describe("cancelClassById — Stripe refund", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "student1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.delete).mockResolvedValue({} as never);
  });

  it("does NOT call Stripe when the class has not been paid", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeCancelClassRow({ paid: false, payments: [] }) as never,
    );

    await cancelClassById("class1");

    expect(mockRefundsCreate).not.toHaveBeenCalled();
    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: "class1" } });
  });

  it("calls stripe.refunds.create with the correct payment_intent for a paid class", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeCancelClassRow({
        paid: true,
        payments: [{ intentId: "pi_paid_intent" }],
      }) as never,
    );
    mockRefundsCreate.mockResolvedValue({ id: "re_test" });

    await cancelClassById("class1");

    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: "pi_paid_intent",
    });
  });

  it("deletes the class after a successful Stripe refund", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeCancelClassRow({
        paid: true,
        payments: [{ intentId: "pi_paid_intent" }],
      }) as never,
    );
    mockRefundsCreate.mockResolvedValue({ id: "re_test" });

    await cancelClassById("class1");

    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: "class1" } });
  });

  it("returns an error string and does NOT delete when Stripe refund fails", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeCancelClassRow({
        paid: true,
        payments: [{ intentId: "pi_paid_intent" }],
      }) as never,
    );
    mockRefundsCreate.mockRejectedValue(new Error("Card declined"));

    const result = await cancelClassById("class1");

    expect(result).toContain("Refund failed");
    expect(result).toContain("Card declined");
    expect(result).toContain("class was not cancelled");
    expect(prisma.class.delete).not.toHaveBeenCalled();
  });

  it("includes a refund mention in the student notification when the class was paid", async () => {
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeCancelClassRow({
        paid: true,
        teacherId: "teacher1",
        payments: [{ intentId: "pi_paid_intent" }],
      }) as never,
    );
    mockRefundsCreate.mockResolvedValue({ id: "re_test" });

    await cancelClassById("class1");

    expect(createNotification).toHaveBeenCalledWith(
      "student1",
      "class_cancelled",
      "Class Cancelled",
      expect.stringContaining("refund"),
      expect.any(String),
    );
  });

  it("returns 'Class not found.' when the class does not exist", async () => {
    vi.mocked(prisma.class.findUnique).mockResolvedValue(null);

    const result = await cancelClassById("class1");

    expect(result).toBe("Class not found.");
    expect(prisma.class.delete).not.toHaveBeenCalled();
    expect(mockRefundsCreate).not.toHaveBeenCalled();
  });
});

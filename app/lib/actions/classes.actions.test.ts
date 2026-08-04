import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import {
  fetchClasses,
  fetchClassById,
  fetchClassesByUser,
  fetchOpenRequestsForTeacher,
  cancelClassById,
  acceptClassById,
  refuseClassById,
  claimClass,
  completeClass,
} from "./classes.actions";

// Helper to simulate Prisma Decimal
const dec = (n: number) => ({
  toNumber: () => n,
  toFixed: (d: number) => n.toFixed(d),
  toString: () => String(n),
});

vi.mock("@/prisma", () => ({
  default: {
    class: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    studentGameProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    teacherGameProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));
// cancelClassById / completeClass instantiate Stripe and call gamification helpers;
// mock both so these tests stay focused on class state transitions.
const stripeCapture = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "pi_test" }));
vi.mock("@/app/lib/stripe", () => ({
  getStripe: vi.fn(() => ({
    refunds:        { create: vi.fn().mockResolvedValue({ id: "re_test" }) },
    paymentIntents: { capture: stripeCapture, cancel: vi.fn().mockResolvedValue({ id: "pi_test" }) },
  })),
}));
vi.mock("@/app/lib/gamification", () => ({
  awardGems:            vi.fn(),
  awardSparks:          vi.fn(),
  awardBadge:           vi.fn(),
  checkSessionBadges:   vi.fn(),
  reverseClassPoints:   vi.fn(),
  updateActivityStreak: vi.fn(),
  maybeAwardLuckyBonus: vi.fn().mockResolvedValue(0),
}));
const transferPayoutForClass = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@/app/lib/payouts", () => ({ transferPayoutForClass }));

const mockSession = { user: { email: "user@test.com" } };

const mockClassRow = (overrides: Record<string, unknown> = {}) => ({
  id: "class1",
  status: "requested",
  startTime: new Date("2026-05-01T10:00:00Z"),
  durationInHours: dec(1.5),
  totalPrice: dec(37.5),
  paid: false,
  createdAt: new Date("2026-04-01T00:00:00Z"),
  requesterId: "student1",
  subjectId: "sub1",
  teacherId: "teacher1",
  studentId: "student1",
  teacher: {
    id: "teacher1",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@test.com",
    role: "teacher",
  },
  student: {
    id: "student1",
    firstName: "Bob",
    lastName: "Jones",
    email: "bob@test.com",
    role: "student",
  },
  subject: { name: "Math" },
  requester: { id: "student1" },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Default: the compare-and-swap claim in claimClass/completeClass succeeds.
  // Tests exercising the "someone else already claimed/completed it" race
  // override this to return { count: 0 }.
  vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
  // Default: no existing scheduled classes for the teacher, so
  // teacherHasSchedulingConflict (used by acceptClassById/claimClass) finds
  // nothing. Tests exercising the conflict-rejection path override this.
  vi.mocked(prisma.class.findMany).mockResolvedValue([]);
});

describe("fetchClasses", () => {
  it("returns formatted class list", async () => {
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      mockClassRow() as never,
    ]);

    const result = await fetchClasses();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "class1",
      status: "requested",
      subject: "Math",
      paid: false,
      durationInHours: "1.5",
      totalPrice: "37.5",
    });
    expect(result[0].teacher).toMatchObject({ name: "Alice Smith" });
    expect(result[0].student).toMatchObject({ name: "Bob Jones" });
  });

  it("handles classes without a teacher (broadcast)", async () => {
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      mockClassRow({ teacher: null, teacherId: null }) as never,
    ]);

    const result = await fetchClasses();

    expect(result[0].teacher).toBeNull();
  });
});

describe("fetchClassById", () => {
  it("returns the class when found", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(
      mockClassRow() as never
    );

    const result = await fetchClassById("class1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("class1");
    expect(result?.subject).toBe("Math");
  });

  it("returns null when class is not found", async () => {
    vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

    const result = await fetchClassById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("fetchClassesByUser", () => {
  it("returns simplified class data for a user", async () => {
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      mockClassRow() as never,
    ]);

    const result = await fetchClassesByUser({ id: "student1" } as never);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "class1",
      status: "requested",
      paid: false,
    });
    // Should not contain nested teacher/student objects
    expect(result[0]).not.toHaveProperty("teacher");
  });
});

describe("cancelClassById", () => {
  it("returns null when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await cancelClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("returns an error when caller is not a participant on the class", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "intruder1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      paid: false,
      payments: [],
      teacherId: "teacher1",
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);

    const result = await cancelClassById("class1");

    expect(result).toBe("You are not authorized to cancel this class.");
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("rejects cancelling a class that has already completed", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "student1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      status: "completed",
      paid: true,
      payments: [{ intentId: "pi_test_123" }],
      teacherId: "teacher1",
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);

    const result = await cancelClassById("class1");

    expect(result).toBe("This class has already been completed and cannot be cancelled.");
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("soft-cancels (not deletes) the class and redirects to student path for student user", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "student1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      status: "scheduled",
      paid: false,
      payments: [],
      teacherId: null,
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: null,
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    const { redirect } = await import("next/navigation");
    const { revalidatePath } = await import("next/cache");

    await cancelClassById("class1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { status: "cancelled" },
    });
    expect(prisma.class.delete).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/main/student/classes");
    expect(redirect).toHaveBeenCalledWith("/main/student/classes?toast=cancelled");
  });

  it("redirects to teacher path for teacher user", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      status: "scheduled",
      paid: false,
      payments: [],
      teacherId: "teacher1",
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    const { redirect } = await import("next/navigation");

    await cancelClassById("class1");

    expect(redirect).toHaveBeenCalledWith("/main/teacher/classes?toast=cancelled");
  });

  it("reverses gamification points on a full refund (>24h before start)", async () => {
    const { reverseClassPoints } = await import("@/app/lib/gamification");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
    const classRow = {
      id: "class1",
      paid: true,
      totalPrice: dec(50),
      startTime: new Date(Date.now() + 48 * 3_600_000), // 48h out — full refund
      payments: [{ intentId: "pi_test_123" }],
      teacherId: "teacher1",
      studentId: "student1",
      gemsAwarded: 50,
      sparksAwarded: 50,
      pointsReversed: false,
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    };
    vi.mocked(prisma.class.findUnique).mockResolvedValue(classRow as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await cancelClassById("class1");

    expect(reverseClassPoints).toHaveBeenCalledWith(classRow);
  });

  it("reverses gamification points on a partial refund (12-24h before start)", async () => {
    const { reverseClassPoints } = await import("@/app/lib/gamification");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
    const classRow = {
      id: "class1",
      paid: true,
      totalPrice: dec(50),
      startTime: new Date(Date.now() + 18 * 3_600_000), // 18h out — 50% refund
      payments: [{ intentId: "pi_test_123" }],
      teacherId: "teacher1",
      studentId: "student1",
      gemsAwarded: 50,
      sparksAwarded: 50,
      pointsReversed: false,
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    };
    vi.mocked(prisma.class.findUnique).mockResolvedValue(classRow as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await cancelClassById("class1");

    expect(reverseClassPoints).toHaveBeenCalledWith(classRow);
  });

  it("does NOT reverse points when cancelling within 12h of start (no refund issued)", async () => {
    const { reverseClassPoints } = await import("@/app/lib/gamification");
    vi.mocked(reverseClassPoints).mockClear();
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      paid: true,
      totalPrice: dec(50),
      startTime: new Date(Date.now() + 6 * 3_600_000), // 6h out — no refund
      payments: [{ intentId: "pi_test_123" }],
      teacherId: "teacher1",
      studentId: "student1",
      gemsAwarded: 50,
      sparksAwarded: 50,
      pointsReversed: false,
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await cancelClassById("class1");

    expect(reverseClassPoints).not.toHaveBeenCalled();
  });

  it("does NOT reverse points when the class was never paid", async () => {
    const { reverseClassPoints } = await import("@/app/lib/gamification");
    vi.mocked(reverseClassPoints).mockClear();
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      paid: false,
      payments: [],
      teacherId: "teacher1",
      studentId: "student1",
      gemsAwarded: 0,
      sparksAwarded: 0,
      pointsReversed: false,
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await cancelClassById("class1");

    expect(reverseClassPoints).not.toHaveBeenCalled();
  });
});

describe("acceptClassById", () => {
  it("returns null when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("returns null when caller is not a participant on the class", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "intruder1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: null,
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("returns null when caller is the requester (cannot accept their own request)", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "student1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: null,
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("claims the transition to 'scheduled' via a compare-and-swap update", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: null,
      totalPrice: dec(37.5),
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(1.5),
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await acceptClassById("class1");

    expect(prisma.class.updateMany).toHaveBeenCalledWith({
      where: { id: "class1", status: "requested" },
      data: { status: "scheduled" },
    });
  });

  it("records gems/sparks awarded on the class when a pre-auth is captured", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: "pi_test123",
      totalPrice: dec(50),
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(1.5),
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);
    vi.mocked((prisma as never as { payment: { create: ReturnType<typeof vi.fn> } }).payment.create)
      .mockResolvedValue({} as never);

    await acceptClassById("class1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { paid: true, gemsAwarded: { increment: 50 } },
    });
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { sparksAwarded: { increment: 50 } },
    });
  });

  // The bug this fix closes (idempotency): a double-click/retried accept
  // used to re-run the Stripe capture (failing silently on an
  // already-captured intent) but still award sparks and send notifications
  // a second time.
  it("does not award or notify again when the class was already accepted (double-click/retry)", async () => {
    const { awardSparks } = await import("@/app/lib/gamification");
    const { createNotification } = await import("@/app/lib/notifications");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: "pi_test123",
      totalPrice: dec(50),
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(1.5),
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);
    // Already accepted by a concurrent/earlier call — status is no longer "requested"
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 0 } as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(stripeCapture).not.toHaveBeenCalled();
    expect(awardSparks).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  // The bug this fix closes (double-booking): two students could request
  // overlapping times with the same teacher, and the teacher could accept
  // both — nothing checked for an existing scheduled conflict at accept time.
  it("rejects accepting into a slot the teacher already has scheduled", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      teacherId: "teacher1",
      studentId: "student1",
      requesterId: "student1",
      preAuthIntentId: null,
      totalPrice: dec(37.5),
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(1.5),
      teacher: { firstName: "Alice", lastName: "Smith" },
      student: { firstName: "Bob", lastName: "Jones" },
      subject: { name: "Math" },
    } as never);
    // Teacher already has another scheduled class overlapping this time
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(1) },
    ] as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.updateMany).not.toHaveBeenCalled();
  });
});

describe("refuseClassById", () => {
  it("updates class status to 'refused'", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await refuseClassById("class1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { status: "refused" },
    });
  });
});

describe("fetchOpenRequestsForTeacher", () => {
  it("returns empty array when teacher is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await fetchOpenRequestsForTeacher("nobody@test.com");

    expect(result).toEqual([]);
  });

  it("returns open requests matching teacher subjects", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      teacherSubject: [{ subjectId: "sub1" }, { subjectId: "sub2" }],
    } as never);

    vi.mocked(prisma.class.findMany).mockResolvedValue([
      {
        id: "class1",
        startTime: new Date("2026-05-01T10:00:00Z"),
        durationInHours: dec(2),
        priority: false,
        student: { firstName: "Ana", lastName: "Lima" },
        subject: { name: "Math" },
      } as never,
    ]);

    const result = await fetchOpenRequestsForTeacher("teacher@test.com");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "class1",
      subject: "Math",
      studentName: "Ana Lima",
      durationInHours: "02H00M",
      priority: false,
    });
  });

  // The bug this fix closes: Class.priority (set from a gem-store "Priority
  // Match" purchase) was never read anywhere, so the perk had no effect.
  it("orders priority requests first, ties broken by start time", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      teacherSubject: [{ subjectId: "sub1" }],
    } as never);
    vi.mocked(prisma.class.findMany).mockResolvedValue([]);

    await fetchOpenRequestsForTeacher("teacher@test.com");

    expect(prisma.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ priority: "desc" }, { startTime: "asc" }],
      }),
    );
  });

  it("returns empty array when teacher has no matching subject requests", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      teacherSubject: [{ subjectId: "sub1" }],
    } as never);

    vi.mocked(prisma.class.findMany).mockResolvedValue([]);

    const result = await fetchOpenRequestsForTeacher("teacher@test.com");

    expect(result).toEqual([]);
  });
});

describe("claimClass", () => {
  it("does nothing when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await claimClass("class1");

    expect(prisma.class.updateMany).not.toHaveBeenCalled();
  });

  it("does nothing when teacher has no price set", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: null,
    } as never);

    await claimClass("class1");

    expect(prisma.class.updateMany).not.toHaveBeenCalled();
  });

  it("assigns teacher and calculates total price via a compare-and-swap update", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);

    vi.mocked(prisma.class.findFirst).mockResolvedValue({
      studentId: "student1",
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(2),
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);

    await claimClass("class1");

    expect(prisma.class.updateMany).toHaveBeenCalledWith({
      where: { id: "class1", teacherId: null, status: "requested" },
      data: expect.objectContaining({
        teacherId: "t1",
        status: "scheduled",
        totalPrice: 60, // 30/hr * 2hr
      }),
    });
  });

  it("silently handles race condition when the class was already claimed before the read", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);

    // Class already claimed (findFirst returns null)
    vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

    // Should not throw
    await expect(claimClass("class1")).resolves.not.toThrow();
    expect(prisma.class.updateMany).not.toHaveBeenCalled();
  });

  it("does not notify the student when another teacher wins the race between read and write", async () => {
    const { createNotification } = await import("@/app/lib/notifications");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);

    vi.mocked(prisma.class.findFirst).mockResolvedValue({
      studentId: "student1",
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(2),
      subject: { name: "Math" },
    } as never);
    // Another teacher claimed it between the read and this write
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 0 } as never);

    await claimClass("class1");

    expect(createNotification).not.toHaveBeenCalled();
  });

  // The bug this fix closes (double-booking): a teacher could claim an open
  // broadcast request even when they already have a scheduled class
  // overlapping that time.
  it("does not claim the request when the teacher already has an overlapping scheduled class", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);
    vi.mocked(prisma.class.findFirst).mockResolvedValue({
      studentId: "student1",
      startTime: new Date("2026-05-01T10:00:00Z"),
      durationInHours: dec(2),
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(1) },
    ] as never);

    await claimClass("class1");

    expect(prisma.class.updateMany).not.toHaveBeenCalled();
  });
});

// Helpers for completeClass tests
const pastStartTime = new Date(Date.now() - 3 * 3_600_000); // started 3h ago

const makeScheduledClass = (overrides: Record<string, unknown> = {}) =>
  mockClassRow({
    status: "scheduled",
    startTime: pastStartTime,
    durationInHours: dec(1), // ended 2h ago
    paid: true,
    preAuthIntentId: null,
    ...overrides,
  });

describe("completeClass", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await completeClass("class1");

    expect(result).toEqual({ error: "Not authenticated." });
  });

  it("returns error when class not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(null);

    const result = await completeClass("class1");

    expect(result).toEqual({ error: "Class not found." });
  });

  it("returns error when status is not scheduled", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeScheduledClass({ status: "requested" }) as never
    );

    const result = await completeClass("class1");

    expect(result).toEqual({ error: "Only scheduled classes can be marked complete." });
  });

  it("returns error when class hasn't ended yet", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    const futureStart = new Date(Date.now() + 3_600_000); // starts in 1h
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeScheduledClass({ startTime: futureStart }) as never
    );

    const result = await completeClass("class1");

    expect(result).toEqual({ error: "Class hasn't ended yet." });
  });

  it("records the gems/sparks awarded on completion", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeScheduledClass() as never);
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await completeClass("class1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { gemsAwarded: { increment: 50 }, sparksAwarded: { increment: 25 } },
    });
  });

  it("marks a paid scheduled class as completed via a compare-and-swap update", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeScheduledClass() as never);
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    const result = await completeClass("class1");

    expect(result).toEqual({});
    expect(prisma.class.updateMany).toHaveBeenCalledWith({
      where: { id: "class1", status: "scheduled" },
      data: { status: "completed" },
    });
  });

  it("returns early without awarding anything when the worker already completed it first", async () => {
    const { awardGems } = await import("@/app/lib/gamification");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeScheduledClass() as never);
    // Another caller (the worker's poller) already flipped this class to "completed"
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 0 } as never);

    const result = await completeClass("class1");

    expect(result).toEqual({});
    expect(transferPayoutForClass).not.toHaveBeenCalled();
    expect(awardGems).not.toHaveBeenCalled();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("triggers the teacher payout after marking a class completed", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeScheduledClass() as never);
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await completeClass("class1");

    expect(transferPayoutForClass).toHaveBeenCalledWith("class1");
  });

  it("captures uncaptured pre-auth on completion", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeScheduledClass({ paid: false, preAuthIntentId: "pi_test123" }) as never
    );
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);
    vi.mocked((prisma as never as { payment: { create: ReturnType<typeof vi.fn> } }).payment.create)
      .mockResolvedValue({} as never);

    const result = await completeClass("class1");

    expect(result).toEqual({});
    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { paid: true },
    });
  });

  it("still completes when Stripe capture fails", async () => {
    stripeCapture.mockRejectedValueOnce(new Error("Stripe error"));

    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(
      makeScheduledClass({ paid: false, preAuthIntentId: "pi_fail" }) as never
    );
    vi.mocked(prisma.class.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    const result = await completeClass("class1");

    expect(result).toEqual({});
    expect(prisma.class.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paid: true }) })
    );
  });

  it("awards gems to student and sparks to teacher on completion", async () => {
    const { awardGems, awardSparks, checkSessionBadges } = await import("@/app/lib/gamification");
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue(makeScheduledClass() as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await completeClass("class1");

    expect(awardGems).toHaveBeenCalledWith("student1", 50);
    expect(awardSparks).toHaveBeenCalledWith("teacher1", 25);
    expect(checkSessionBadges).toHaveBeenCalledWith("student1", "student");
    expect(checkSessionBadges).toHaveBeenCalledWith("teacher1", "teacher");
  });
});

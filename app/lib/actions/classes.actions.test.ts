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
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));
// cancelClassById instantiates Stripe — mock as a class so `new Stripe(...)` works
vi.mock("stripe", () => ({
  default: class MockStripe {
    refunds = { create: vi.fn().mockResolvedValue({ id: "re_test" }) };
  },
}));

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
    expect(prisma.class.delete).not.toHaveBeenCalled();
  });

  it("deletes the class and redirects to student path for student user", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "student1",
      role: "student",
    } as never);
    vi.mocked(prisma.class.findUnique).mockResolvedValue({
      id: "class1",
      paid: false,
      payments: [],
      teacherId: null,
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: null,
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.delete).mockResolvedValue({} as never);

    const { redirect } = await import("next/navigation");
    const { revalidatePath } = await import("next/cache");

    await cancelClassById("class1");

    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: "class1" } });
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
      paid: false,
      payments: [],
      teacherId: "teacher1",
      studentId: "student1",
      student: { id: "student1", firstName: "Bob", lastName: "Jones" },
      teacher: { id: "teacher1", firstName: "Alice", lastName: "Smith" },
      subject: { name: "Math" },
    } as never);
    vi.mocked(prisma.class.delete).mockResolvedValue({} as never);

    const { redirect } = await import("next/navigation");

    await cancelClassById("class1");

    expect(redirect).toHaveBeenCalledWith("/main/teacher/classes?toast=cancelled");
  });
});

describe("acceptClassById", () => {
  it("returns null when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await acceptClassById("class1");

    expect(result).toBeNull();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });

  it("updates class status to 'scheduled'", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({
      id: "teacher1",
      role: "teacher",
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await acceptClassById("class1");

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: "class1" },
      data: { status: "scheduled" },
    });
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
    });
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

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing when teacher has no price set", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: null,
    } as never);

    await claimClass("class1");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("assigns teacher and calculates total price in a transaction", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);

    // Make $transaction execute its callback with the prisma mock as the tx client
    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)
    );

    vi.mocked(prisma.class.findFirst).mockResolvedValue({
      durationInHours: dec(2),
    } as never);
    vi.mocked(prisma.class.update).mockResolvedValue({} as never);

    await claimClass("class1");

    expect(prisma.class.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "class1" },
        data: expect.objectContaining({
          teacherId: "t1",
          status: "scheduled",
          totalPrice: 60, // 30/hr * 2hr
        }),
      })
    );
  });

  it("silently handles race condition when class is already claimed", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      pricePerHour: dec(30),
    } as never);

    vi.mocked(prisma.$transaction).mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)
    );

    // Class already claimed (findFirst returns null)
    vi.mocked(prisma.class.findFirst).mockResolvedValue(null);

    // Should not throw
    await expect(claimClass("class1")).resolves.not.toThrow();
    expect(prisma.class.update).not.toHaveBeenCalled();
  });
});

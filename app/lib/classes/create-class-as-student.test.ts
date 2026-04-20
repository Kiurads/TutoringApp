import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { createClassAsStudent } from "./create-class-as-student";

// Helper to simulate Prisma Decimal
const dec = (n: number) => ({
  toNumber: () => n,
  toFixed: (d: number) => n.toFixed(d),
  toString: () => String(n),
});

vi.mock("@/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
      create: vi.fn(),
    },
    subject: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

const mockSession = { user: { email: "student@test.com" } };

// Future date (tomorrow)
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2); // +2 to be safe in all timezones
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

// Past date (yesterday)
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

const makeFormData = (fields: Record<string, string>): FormData => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createClassAsStudent — auth & validation", () => {
  it("returns error when user is not logged in", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: tomorrow(), duration: "1" })
    );

    expect(result).toBe("You must be logged in to create a class.");
  });

  it("returns error when subject is missing", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ startTime: tomorrow(), duration: "1" })
    );

    expect(result).toBe("Please select a subject.");
  });

  it("returns error when startTime is missing", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", duration: "1" })
    );

    expect(result).toBe("Please select a start time.");
  });

  it("returns error when duration is missing", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: tomorrow() })
    );

    expect(result).toBe("Please select a duration.");
  });

  it("returns error when start time is in the past", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: yesterday(), duration: "1" })
    );

    expect(result).toBe("Start time must be from tomorrow onward.");
  });

  it("returns error when student record is not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: tomorrow(), duration: "1" })
    );

    expect(result).toBe("Student not found.");
  });
});

describe("createClassAsStudent — with specific teacher", () => {
  it("returns error when teacher is not found or has no price", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "s1" } as never) // student lookup
      .mockResolvedValueOnce(null); // teacher lookup

    const result = await createClassAsStudent(
      undefined,
      makeFormData({
        subject: "sub1",
        teacher: "t1",
        startTime: tomorrow(),
        duration: "1",
      })
    );

    expect(result).toBe("Teacher not found.");
  });

  it("creates a class with correct price when teacher is found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "s1" } as never)                                        // student by email
      .mockResolvedValueOnce({ pricePerHour: dec(30) } as never)                           // teacher by id
      .mockResolvedValueOnce({ firstName: "Ana", lastName: "Lima" } as never);             // student record for notification
    vi.mocked((prisma as never as { subject: { findUnique: ReturnType<typeof vi.fn> } }).subject.findUnique)
      .mockResolvedValue({ name: "Math" } as never);
    vi.mocked(prisma.class.create).mockResolvedValue({ id: "new-class-1" } as never);

    const { redirect } = await import("next/navigation");

    await createClassAsStudent(
      undefined,
      makeFormData({
        subject: "sub1",
        teacher: "t1",
        startTime: tomorrow(),
        duration: "2",
      })
    );

    expect(prisma.class.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "s1",
          teacherId: "t1",
          subjectId: "sub1",
          totalPrice: 60, // 30/hr * 2hr
          status: "requested",
          durationInHours: 2,
        }),
      })
    );
    expect(redirect).toHaveBeenCalledWith("/main/student/classes?toast=created");
  });
});

describe("createClassAsStudent — broadcast mode (no teacher)", () => {
  it("returns error when no online teachers are available for the subject", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const result = await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: tomorrow(), duration: "1" })
    );

    expect(result).toBe(
      "No teachers are currently available for this subject. Try again later or schedule with a specific teacher."
    );
    expect(prisma.class.create).not.toHaveBeenCalled();
  });

  it("creates a broadcast class with price 0 when teachers are available", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "t1" } as never,
    ]);
    vi.mocked(prisma.class.create).mockResolvedValue({} as never);

    const { redirect } = await import("next/navigation");

    await createClassAsStudent(
      undefined,
      makeFormData({ subject: "sub1", startTime: tomorrow(), duration: "1.5" })
    );

    expect(prisma.class.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teacherId: null,
          totalPrice: 0,
          status: "requested",
          durationInHours: 1.5,
        }),
      })
    );
    expect(redirect).toHaveBeenCalledWith("/main/student/classes?toast=created");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClassWithPreAuth } from "./create-class-with-pre-auth";

const dec = (n: number) => ({
  toNumber: () => n,
  toFixed: (d: number) => n.toFixed(d),
  toString: () => String(n),
});

vi.mock("@/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
    subject: { findUnique: vi.fn() },
    teacherAvailability: { findMany: vi.fn() },
    class: { create: vi.fn(), findMany: vi.fn() },
    studentGameProfile: { update: vi.fn() },
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

const mockSession = { user: { email: "student@test.com" } };

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};

const validData = {
  subjectId: "sub1",
  teacherId: "teacher1",
  durationInHours: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([]);
  vi.mocked(prisma.class.findMany).mockResolvedValue([]);
  vi.mocked(prisma.subject.findUnique).mockResolvedValue({ name: "Math" } as never);
});

describe("createClassWithPreAuth", () => {
  it("returns an error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await createClassWithPreAuth(
      { ...validData, startTime: tomorrow() },
      "pi_test",
    );

    expect(result).toEqual({ error: "Not authenticated." });
  });

  it("returns an error when the teacher has no price set", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "student1" } as never)
      .mockResolvedValueOnce(null);

    const result = await createClassWithPreAuth(
      { ...validData, startTime: tomorrow() },
      "pi_test",
    );

    expect(result).toEqual({ error: "Teacher or price not found." });
  });

  it("returns an error when the teacher is not available at the requested time", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "student1" } as never)
      .mockResolvedValueOnce({ pricePerHour: dec(30) } as never);
    vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([
      { dayOfWeek: 1, startHour: 9, startMin: 0 },
    ] as never);

    const result = await createClassWithPreAuth(
      { ...validData, startTime: tomorrow() },
      "pi_test",
    );

    expect(result).toEqual({ error: "The teacher is not available at the selected time." });
    expect(prisma.class.create).not.toHaveBeenCalled();
  });

  // The bug this fix closes: booking only checked the teacher's general
  // weekly availability, never existing overlapping scheduled classes.
  it("rejects booking when the teacher already has an overlapping scheduled class", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "student1" } as never)
      .mockResolvedValueOnce({ pricePerHour: dec(30) } as never);
    const requestedStart = tomorrow();
    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { startTime: new Date(requestedStart), durationInHours: dec(2) },
    ] as never);

    const result = await createClassWithPreAuth(
      { ...validData, startTime: requestedStart },
      "pi_test",
    );

    expect(result).toEqual({ error: "The teacher already has a class scheduled at this time." });
    expect(prisma.class.create).not.toHaveBeenCalled();
  });

  it("creates the class and redirects on success", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ id: "student1" } as never)
      .mockResolvedValueOnce({ pricePerHour: dec(30) } as never);
    vi.mocked(prisma.class.create).mockResolvedValue({ id: "class1" } as never);

    await createClassWithPreAuth({ ...validData, startTime: tomorrow() }, "pi_test");

    expect(prisma.class.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "student1",
          teacherId: "teacher1",
          subjectId: "sub1",
          status: "requested",
          preAuthIntentId: "pi_test",
          totalPrice: 60,
        }),
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/main/student/classes?toast=created");
  });
});

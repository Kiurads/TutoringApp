import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import {
  fetchTeachers,
  fetchTeachersExtended,
  fetchTeachersBySubjectsId,
  getTeacherOnlineStatus,
  toggleTeacherOnline,
  fetchTeacherById,
} from "./teachers.actions";

// Helper to simulate Prisma Decimal type
const dec = (n: number) => ({
  toNumber: () => n,
  toFixed: (d: number) => n.toFixed(d),
  toString: () => String(n),
});

vi.mock("@/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockTeacherRow = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  email: "teacher@test.com",
  firstName: "Alice",
  lastName: "Smith",
  bio: "Experienced tutor",
  isOnline: true,
  pricePerHour: dec(25),
  teacherRatingsAsTeacher: [{ rating: dec(4) }, { rating: dec(5) }],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchTeachers", () => {
  it("returns teachers with averaged rating and formatted price", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      mockTeacherRow() as never,
    ]);

    const result = await fetchTeachers();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "t1",
      name: "Alice Smith",
      email: "teacher@test.com",
      pricePerHour: "25.00",
      rating: "4.50", // (4+5)/2
      isOnline: true,
    });
  });

  it("shows 'No Reviews' when teacher has no ratings", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      mockTeacherRow({ teacherRatingsAsTeacher: [] }) as never,
    ]);

    const result = await fetchTeachers();

    expect(result[0].rating).toBe("No Reviews");
  });

  it("shows '0.00' when teacher has no price set", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      mockTeacherRow({ pricePerHour: null }) as never,
    ]);

    const result = await fetchTeachers();

    expect(result[0].pricePerHour).toBe("0.00");
  });

  it("sorts online teachers before offline teachers", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      mockTeacherRow({ id: "t2", isOnline: false }) as never,
      mockTeacherRow({ id: "t1", isOnline: true }) as never,
    ]);

    const result = await fetchTeachers();

    expect(result[0].isOnline).toBe(true);
    expect(result[1].isOnline).toBe(false);
  });
});

describe("fetchTeachersExtended", () => {
  it("includes subjects in the result", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      mockTeacherRow({
        teacherSubject: [
          { subject: { name: "Math" } },
          { subject: { name: "Physics" } },
        ],
      }) as never,
    ]);

    const result = await fetchTeachersExtended();

    expect(result[0].subjects).toEqual(["Math", "Physics"]);
    expect(result[0].status).toBe("Active");
  });
});

describe("fetchTeachersBySubjectsId", () => {
  it("returns teachers filtered by subject ids", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "t1", firstName: "Bob", lastName: "Jones", email: "bob@test.com" } as never,
    ]);

    const result = await fetchTeachersBySubjectsId(["sub1"]);

    expect(result).toEqual([
      { id: "t1", name: "Bob Jones", email: "bob@test.com", role: "teacher" },
    ]);
  });
});

describe("getTeacherOnlineStatus", () => {
  it("returns true when teacher is online", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isOnline: true } as never);

    expect(await getTeacherOnlineStatus("teacher@test.com")).toBe(true);
  });

  it("returns false when teacher is offline", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isOnline: false } as never);

    expect(await getTeacherOnlineStatus("teacher@test.com")).toBe(false);
  });

  it("returns false when teacher is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    expect(await getTeacherOnlineStatus("nobody@test.com")).toBe(false);
  });
});

describe("toggleTeacherOnline", () => {
  it("toggles offline teacher to online", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isOnline: false } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ isOnline: true } as never);

    const result = await toggleTeacherOnline("teacher@test.com");

    expect(result).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "teacher@test.com" },
      data: { isOnline: true },
      select: { isOnline: true },
    });
  });

  it("toggles online teacher to offline", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isOnline: true } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({ isOnline: false } as never);

    const result = await toggleTeacherOnline("teacher@test.com");

    expect(result).toBe(false);
  });

  it("throws when user is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(toggleTeacherOnline("nobody@test.com")).rejects.toThrow(
      "User not found"
    );
  });
});

describe("fetchTeacherById", () => {
  it("returns formatted teacher details", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "t1",
      firstName: "Carol",
      lastName: "White",
      email: "carol@test.com",
    } as never);

    const result = await fetchTeacherById("t1");

    expect(result).toEqual({
      id: "t1",
      name: "Carol White",
      email: "carol@test.com",
      role: "teacher",
    });
  });

  it("throws when teacher is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(fetchTeacherById("nonexistent")).rejects.toThrow(
      "Teacher not found"
    );
  });
});

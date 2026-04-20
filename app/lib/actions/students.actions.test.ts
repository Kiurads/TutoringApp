import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import { fetchStudents, fetchStudentsByTeacher } from "./students.actions";

vi.mock("@/prisma", () => ({
  default: {
    user: {
      findMany: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    regularClass: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));

const mockSession = { user: { email: "teacher@test.com" } };

const makeStudent = (id: string, first: string, last: string) => ({
  id,
  firstName: first,
  lastName: last,
  email: `${first.toLowerCase()}@test.com`,
  phoneNumber: null,
  role: "student",
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchStudents", () => {
  it("returns a formatted list of all students", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      makeStudent("s1", "Ana", "Lima") as never,
      makeStudent("s2", "Carlos", "Silva") as never,
    ]);

    const result = await fetchStudents();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "s1",
      name: "Ana Lima",
      email: "ana@test.com",
      role: "student",
    });
    expect(result[1].name).toBe("Carlos Silva");
  });

  it("returns an empty array when there are no students", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    expect(await fetchStudents()).toEqual([]);
  });

  it("returns an empty array on database error", async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("DB error"));

    expect(await fetchStudents()).toEqual([]);
  });
});

describe("fetchStudentsByTeacher", () => {
  it("returns empty array when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    expect(await fetchStudentsByTeacher()).toEqual([]);
  });

  it("returns empty array when teacher user is not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue(null);

    expect(await fetchStudentsByTeacher()).toEqual([]);
  });

  it("returns students from one-off classes", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1" } as never);

    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { student: makeStudent("s1", "Ana", "Lima") } as never,
    ]);
    vi.mocked(prisma.regularClass.findMany).mockResolvedValue([]);

    const result = await fetchStudentsByTeacher();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ana Lima");
  });

  it("returns students from regular classes", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1" } as never);

    vi.mocked(prisma.class.findMany).mockResolvedValue([]);
    vi.mocked(prisma.regularClass.findMany).mockResolvedValue([
      { student: makeStudent("s2", "Carlos", "Silva") } as never,
    ]);

    const result = await fetchStudentsByTeacher();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Carlos Silva");
  });

  it("deduplicates students appearing in both class types", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1" } as never);

    const student = makeStudent("s1", "Ana", "Lima");

    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { student } as never,
    ]);
    vi.mocked(prisma.regularClass.findMany).mockResolvedValue([
      { student } as never, // same student
    ]);

    const result = await fetchStudentsByTeacher();

    expect(result).toHaveLength(1);
  });

  it("deduplicates students appearing in multiple classes of the same type", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1" } as never);

    const student = makeStudent("s1", "Ana", "Lima");

    vi.mocked(prisma.class.findMany).mockResolvedValue([
      { student } as never,
      { student } as never, // same student, two classes
    ]);
    vi.mocked(prisma.regularClass.findMany).mockResolvedValue([]);

    const result = await fetchStudentsByTeacher();

    expect(result).toHaveLength(1);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.class.findMany).mockRejectedValue(new Error("DB error"));

    expect(await fetchStudentsByTeacher()).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import {
  fetchSubjects,
  fetchSubjectsByName,
  fetchSubjectsById,
  fetchSubjectsWithTeachers,
} from "./subjects.actions";

vi.mock("@/prisma", () => ({
  default: {
    subject: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchSubjects", () => {
  it("returns subjects with teacher count", async () => {
    vi.mocked(prisma.subject.findMany).mockResolvedValue([
      { id: "sub1", name: "Math", _count: { teacherSubject: 3 } } as never,
      { id: "sub2", name: "Physics", _count: { teacherSubject: 1 } } as never,
    ]);

    const result = await fetchSubjects();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "sub1", name: "Math", teacherCount: 3 });
    expect(result[1]).toEqual({ id: "sub2", name: "Physics", teacherCount: 1 });
  });

  it("returns an empty array when there are no subjects", async () => {
    vi.mocked(prisma.subject.findMany).mockResolvedValue([]);

    expect(await fetchSubjects()).toEqual([]);
  });
});

describe("fetchSubjectsByName", () => {
  it("calls findMany with a contains filter", async () => {
    vi.mocked(prisma.subject.findMany).mockResolvedValue([
      { id: "sub1", name: "Mathematics" } as never,
    ]);

    const result = await fetchSubjectsByName("math");

    expect(prisma.subject.findMany).toHaveBeenCalledWith({
      where: { name: { contains: "math" } },
    });
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no subjects match", async () => {
    vi.mocked(prisma.subject.findMany).mockResolvedValue([]);

    expect(await fetchSubjectsByName("xyz")).toEqual([]);
  });
});

describe("fetchSubjectsById", () => {
  it("returns the subject when found", async () => {
    vi.mocked(prisma.subject.findUnique).mockResolvedValue({
      id: "sub1",
      name: "Math",
    } as never);

    const result = await fetchSubjectsById("sub1");

    expect(result).toMatchObject({ id: "sub1", name: "Math" });
  });

  it("returns null when subject is not found", async () => {
    vi.mocked(prisma.subject.findUnique).mockResolvedValue(null);

    expect(await fetchSubjectsById("nonexistent")).toBeNull();
  });
});

describe("fetchSubjectsWithTeachers", () => {
  it("returns only subjects that have at least one teacher", async () => {
    vi.mocked(prisma.subject.findMany).mockResolvedValue([
      { id: "sub1", name: "Math" } as never,
    ]);

    const result = await fetchSubjectsWithTeachers();

    expect(prisma.subject.findMany).toHaveBeenCalledWith({
      where: { teacherSubject: { some: {} } },
    });
    expect(result).toHaveLength(1);
  });
});

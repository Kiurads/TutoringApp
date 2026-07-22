import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { updateTeacherSubjects } from "./update-teacher-subjects";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn() },
		teacherSubject: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("updateTeacherSubjects", () => {
	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await updateTeacherSubjects(["sub1"]);

		expect(result.error).toBe("Not authenticated.");
		expect(prisma.teacherSubject.createMany).not.toHaveBeenCalled();
	});

	it("returns an error for a non-teacher user", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "u1",
			role: "student",
		} as never);

		const result = await updateTeacherSubjects(["sub1"]);

		expect(result.error).toBe("Only teachers can update subjects.");
		expect(prisma.teacherSubject.createMany).not.toHaveBeenCalled();
	});

	it("replaces the teacher's subjects on success", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "teacher1",
			role: "teacher",
		} as never);

		const result = await updateTeacherSubjects(["sub1", "sub2"]);

		expect(prisma.teacherSubject.deleteMany).toHaveBeenCalledWith({
			where: { teacherId: "teacher1", subjectId: { notIn: ["sub1", "sub2"] } },
		});
		expect(prisma.teacherSubject.createMany).toHaveBeenCalledWith({
			data: [
				{ teacherId: "teacher1", subjectId: "sub1" },
				{ teacherId: "teacher1", subjectId: "sub2" },
			],
			skipDuplicates: true,
		});
		expect(result.success).toBe(true);
	});

	it("clears all subjects when given an empty list", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "teacher1",
			role: "teacher",
		} as never);

		const result = await updateTeacherSubjects([]);

		expect(prisma.teacherSubject.deleteMany).toHaveBeenCalledWith({
			where: { teacherId: "teacher1", subjectId: { notIn: [] } },
		});
		expect(result.success).toBe(true);
	});

	it("returns a generic error if the database call fails", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({
			id: "teacher1",
			role: "teacher",
		} as never);
		vi.mocked(prisma.teacherSubject.deleteMany).mockRejectedValue(new Error("db down"));

		const result = await updateTeacherSubjects(["sub1"]);

		expect(result.error).toMatch(/Something went wrong/);
	});
});

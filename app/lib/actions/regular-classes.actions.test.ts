import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import { cancelClassCore } from "./classes.actions";
import { materializeOccurrences } from "@/app/lib/regular-classes/materialize-occurrences";
import {
	requestRegularClass,
	acceptRegularClass,
	refuseRegularClass,
	cancelRegularClass,
	fetchRegularClassesByStudent,
	fetchRegularClassesByTeacher,
} from "./regular-classes.actions";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

vi.mock("@/prisma", () => ({
	default: {
		user: {
			findUnique: vi.fn(),
		},
		subject: {
			findUnique: vi.fn(),
		},
		regularClass: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			findMany: vi.fn(),
		},
		class: {
			findMany: vi.fn(),
		},
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/app/lib/regular-classes/materialize-occurrences", () => ({
	materializeOccurrences: vi.fn(),
}));
vi.mock("./classes.actions", () => ({ cancelClassCore: vi.fn() }));

const mockSession = { user: { email: "student@test.com" } };

const makeFormData = (fields: Record<string, string>): FormData => {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return fd;
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("requestRegularClass", () => {
	it("returns error when not logged in", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await requestRegularClass(
			undefined,
			makeFormData({ subject: "sub1", teacher: "t1", dayOfWeek: "3", time: "15:30", duration: "1" }),
		);

		expect(result).toBe("You must be logged in to request a recurring class.");
	});

	it("returns error when a required field is missing", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);

		const result = await requestRegularClass(
			undefined,
			makeFormData({ teacher: "t1", dayOfWeek: "3", time: "15:30", duration: "1" }),
		);

		expect(result).toBe("Please select a subject.");
	});

	it("returns error for an invalid day of week", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);

		const result = await requestRegularClass(
			undefined,
			makeFormData({ subject: "sub1", teacher: "t1", dayOfWeek: "9", time: "15:30", duration: "1" }),
		);

		expect(result).toBe("Invalid day of week.");
	});

	it("returns error when teacher has no price set", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique)
			.mockResolvedValueOnce({ id: "s1" } as never) // student
			.mockResolvedValueOnce(null); // teacher

		const result = await requestRegularClass(
			undefined,
			makeFormData({ subject: "sub1", teacher: "t1", dayOfWeek: "3", time: "15:30", duration: "1" }),
		);

		expect(result).toBe("Teacher not found.");
	});

	it("creates a requested regular class with correct price snapshot", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(prisma.user.findUnique)
			.mockResolvedValueOnce({ id: "s1" } as never)
			.mockResolvedValueOnce({ pricePerHour: dec(20), firstName: "Alice", lastName: "Smith" } as never);
		vi.mocked(prisma.subject.findUnique).mockResolvedValue({ name: "Math" } as never);
		vi.mocked(prisma.regularClass.create).mockResolvedValue({ id: "rc1" } as never);

		const { redirect } = await import("next/navigation");

		await requestRegularClass(
			undefined,
			makeFormData({ subject: "sub1", teacher: "t1", dayOfWeek: "3", time: "15:30", duration: "2" }),
		);

		expect(prisma.regularClass.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					studentId: "s1",
					teacherId: "t1",
					subjectId: "sub1",
					dayOfWeek: 3,
					durationInHours: 2,
					totalPrice: 40,
					status: "requested",
				}),
			}),
		);
		expect(redirect).toHaveBeenCalledWith("/main/student/regular-classes?toast=created");
	});
});

describe("acceptRegularClass", () => {
	it("does nothing when caller is not the series teacher", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "intruder1", role: "teacher" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "requested",
			dayOfWeek: 1,
		} as never);

		await acceptRegularClass("rc1");

		expect(prisma.regularClass.update).not.toHaveBeenCalled();
		expect(materializeOccurrences).not.toHaveBeenCalled();
	});

	it("does nothing when status is not 'requested'", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "teacher1", role: "teacher" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "active",
			dayOfWeek: 1,
		} as never);

		await acceptRegularClass("rc1");

		expect(prisma.regularClass.update).not.toHaveBeenCalled();
	});

	it("activates the series and triggers immediate materialization", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "teacher1", role: "teacher" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "requested",
			dayOfWeek: 1,
		} as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);
		vi.mocked(materializeOccurrences).mockResolvedValue(4);

		await acceptRegularClass("rc1");

		expect(prisma.regularClass.update).toHaveBeenCalledWith({
			where: { id: "rc1" },
			data: { status: "active" },
		});
		expect(materializeOccurrences).toHaveBeenCalledWith("rc1");
	});
});

describe("refuseRegularClass", () => {
	it("sets status to inactive when authorized and pending", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "teacher1", role: "teacher" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "requested",
			dayOfWeek: 2,
		} as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);

		await refuseRegularClass("rc1");

		expect(prisma.regularClass.update).toHaveBeenCalledWith({
			where: { id: "rc1" },
			data: { status: "inactive" },
		});
	});
});

describe("cancelRegularClass", () => {
	it("does nothing when caller is not a participant", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "intruder1", role: "student" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "active",
			dayOfWeek: 2,
		} as never);

		await cancelRegularClass("rc1");

		expect(prisma.regularClass.update).not.toHaveBeenCalled();
	});

	it("deactivates the series and cancels future non-terminal occurrences only", async () => {
		vi.mocked(auth).mockResolvedValue(mockSession as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "student1", role: "student" } as never);
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			id: "rc1",
			teacherId: "teacher1",
			studentId: "student1",
			status: "active",
			dayOfWeek: 2,
		} as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ id: "occ1" },
			{ id: "occ2" },
		] as never);

		await cancelRegularClass("rc1");

		expect(prisma.regularClass.update).toHaveBeenCalledWith({
			where: { id: "rc1" },
			data: { status: "inactive" },
		});
		expect(prisma.class.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					regularClassId: "rc1",
					status: { in: ["requested", "scheduled"] },
				}),
			}),
		);
		expect(cancelClassCore).toHaveBeenCalledTimes(2);
		expect(cancelClassCore).toHaveBeenCalledWith("occ1", { id: "student1", role: "student" });
		expect(cancelClassCore).toHaveBeenCalledWith("occ2", { id: "student1", role: "student" });
	});
});

describe("fetchRegularClassesByStudent", () => {
	it("returns formatted regular classes for a student", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1" } as never);
		vi.mocked(prisma.regularClass.findMany).mockResolvedValue([
			{
				id: "rc1",
				status: "active",
				dayOfWeek: 3,
				startTime: new Date("2026-01-01T14:30:00.000Z"),
				durationInHours: dec(1),
				totalPrice: dec(20),
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
				subject: { name: "Math" },
				student: { id: "s1", firstName: "Bob", lastName: "Jones", email: "bob@test.com", role: "student" },
				teacher: { id: "t1", firstName: "Alice", lastName: "Smith", email: "alice@test.com", role: "teacher" },
			},
		] as never);

		const result = await fetchRegularClassesByStudent("bob@test.com");

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "rc1",
			status: "active",
			dayOfWeek: 3,
			startTime: "14:30",
			subject: "Math",
		});
	});

	it("returns an empty array when the student email is not found", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await fetchRegularClassesByStudent("nobody@test.com");

		expect(result).toEqual([]);
	});
});

describe("fetchRegularClassesByTeacher", () => {
	it("returns an empty array when the teacher email is not found", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

		const result = await fetchRegularClassesByTeacher("nobody@test.com");

		expect(result).toEqual([]);
	});
});

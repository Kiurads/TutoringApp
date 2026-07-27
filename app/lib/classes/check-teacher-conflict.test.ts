import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { teacherHasSchedulingConflict } from "./check-teacher-conflict";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

vi.mock("@/prisma", () => ({
	default: {
		class: { findMany: vi.fn() },
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("teacherHasSchedulingConflict", () => {
	it("returns false when the teacher has no scheduled classes", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([]);

		const result = await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-01T10:00:00Z"),
			1,
		);

		expect(result).toBe(false);
	});

	it("only queries scheduled classes for the given teacher", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([]);

		await teacherHasSchedulingConflict("teacher1", new Date("2026-05-01T10:00:00Z"), 1);

		expect(prisma.class.findMany).toHaveBeenCalledWith({
			where: { teacherId: "teacher1", status: "scheduled" },
			select: { startTime: true, durationInHours: true },
		});
	});

	it("excludes the given class id from the conflict check", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([]);

		await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-01T10:00:00Z"),
			1,
			"class1",
		);

		expect(prisma.class.findMany).toHaveBeenCalledWith({
			where: { teacherId: "teacher1", status: "scheduled", id: { not: "class1" } },
			select: { startTime: true, durationInHours: true },
		});
	});

	it("detects an exact time-slot overlap", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(1) },
		] as never);

		const result = await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-01T10:00:00Z"),
			1,
		);

		expect(result).toBe(true);
	});

	it("detects a partial overlap (candidate starts mid-way through an existing class)", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(2) },
		] as never);

		// Existing class runs 10:00-12:00; candidate starts 11:00-12:30
		const result = await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-01T11:00:00Z"),
			1.5,
		);

		expect(result).toBe(true);
	});

	it("does not flag back-to-back classes (candidate starts exactly when the existing one ends)", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(1) },
		] as never);

		// Existing class runs 10:00-11:00; candidate starts exactly at 11:00
		const result = await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-01T11:00:00Z"),
			1,
		);

		expect(result).toBe(false);
	});

	it("does not flag a class on a completely different day", async () => {
		vi.mocked(prisma.class.findMany).mockResolvedValue([
			{ startTime: new Date("2026-05-01T10:00:00Z"), durationInHours: dec(1) },
		] as never);

		const result = await teacherHasSchedulingConflict(
			"teacher1",
			new Date("2026-05-02T10:00:00Z"),
			1,
		);

		expect(result).toBe(false);
	});
});

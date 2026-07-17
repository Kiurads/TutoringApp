import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { materializeOccurrences } from "./materialize-occurrences";

const dec = (n: number) => ({
	toNumber: () => n,
	toFixed: (d: number) => n.toFixed(d),
	toString: () => String(n),
});

vi.mock("@/prisma", () => ({
	default: {
		regularClass: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
		class: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	},
}));

vi.mock("@/app/lib/classes/generate-jitsi-room", () => ({
	generateJitsiRoom: () => "estudyou-test-room",
}));

const baseRegularClass = {
	id: "rc1",
	studentId: "student1",
	teacherId: "teacher1",
	subjectId: "sub1",
	dayOfWeek: new Date().getDay(), // guaranteed to occur within any 4-week window
	startTime: new Date("2026-01-01T14:30:00.000Z"),
	durationInHours: dec(1),
	totalPrice: dec(20),
	status: "active",
	lastMaterializedThrough: null,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("materializeOccurrences", () => {
	it("returns 0 and does nothing when the regular class is not found", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(null);

		const result = await materializeOccurrences("rc1");

		expect(result).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
		expect(prisma.regularClass.update).not.toHaveBeenCalled();
	});

	it("returns 0 and does nothing when the series is not active", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			...baseRegularClass,
			status: "requested",
		} as never);

		const result = await materializeOccurrences("rc1");

		expect(result).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
	});

	it("creates occurrences for every matching week in the rolling window when none exist yet", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(baseRegularClass as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(null); // nothing exists yet
		vi.mocked(prisma.class.create).mockResolvedValue({} as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);

		const created = await materializeOccurrences("rc1");

		// A 4-week rolling window on a weekly cadence always yields at least 4 matches
		expect(created).toBeGreaterThanOrEqual(4);
		expect(prisma.class.create).toHaveBeenCalledTimes(created);
		expect(prisma.class.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					studentId: "student1",
					teacherId: "teacher1",
					subjectId: "sub1",
					status: "scheduled",
					requesterId: "student1",
					regularClassId: "rc1",
					jitsiRoom: "estudyou-test-room",
					totalPrice: baseRegularClass.totalPrice,
				}),
			}),
		);
	});

	it("does not recreate occurrences that already exist", async () => {
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue(baseRegularClass as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue({ id: "existing" } as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);

		const created = await materializeOccurrences("rc1");

		expect(created).toBe(0);
		expect(prisma.class.create).not.toHaveBeenCalled();
		// Watermark still advances even when nothing new was created
		expect(prisma.regularClass.update).toHaveBeenCalled();
	});

	it("never moves the watermark backward", async () => {
		const farFuture = new Date(Date.now() + 10 * 7 * 24 * 3_600_000); // 10 weeks out
		vi.mocked(prisma.regularClass.findUnique).mockResolvedValue({
			...baseRegularClass,
			lastMaterializedThrough: farFuture,
		} as never);
		vi.mocked(prisma.regularClass.update).mockResolvedValue({} as never);

		await materializeOccurrences("rc1");

		expect(prisma.class.create).not.toHaveBeenCalled();
		expect(prisma.regularClass.update).toHaveBeenCalledWith({
			where: { id: "rc1" },
			data: { lastMaterializedThrough: farFuture },
		});
	});
});

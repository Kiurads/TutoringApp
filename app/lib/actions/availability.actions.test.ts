import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { setAvailability, fetchAvailability, type AvailabilitySlot } from "./availability.actions";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn(), update: vi.fn() },
		teacherAvailability: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
		$transaction: vi.fn(),
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const teacher = { id: "teacher1", role: "teacher" };
const slot: AvailabilitySlot = { dayOfWeek: 1, startHour: 9, startMin: 0, endHour: 9, endMin: 30 };

beforeEach(() => {
	vi.clearAllMocks();
});

describe("setAvailability", () => {
	it("errors when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await setAvailability([slot]);

		expect(result).toEqual({ error: "Not authenticated." });
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it("errors when the caller isn't a teacher", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "s@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "s1", role: "student" } as never);

		const result = await setAvailability([slot]);

		expect(result).toEqual({ error: "Not authorized." });
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it("saves slots without touching timezone when none is passed", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(teacher as never);

		const result = await setAvailability([slot]);

		expect(result).toEqual({});
		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as unknown[];
		expect(ops).toHaveLength(2); // deleteMany + createMany, no user.update
	});

	it("rejects an invalid timezone string without writing anything", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(teacher as never);

		const result = await setAvailability([slot], "Not/A_Real_Zone");

		expect(result).toEqual({ error: "That doesn't look like a valid timezone." });
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it("saves slots and updates the timezone when a valid one is passed", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "t@test.com" } } as never);
		vi.mocked(prisma.user.findUnique).mockResolvedValue(teacher as never);

		const result = await setAvailability([slot], "Europe/Lisbon");

		expect(result).toEqual({});
		expect(prisma.$transaction).toHaveBeenCalledTimes(1);
		const ops = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as unknown[];
		expect(ops).toHaveLength(3); // deleteMany + createMany + user.update
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: "teacher1" },
			data: { timezone: "Europe/Lisbon" },
		});
	});
});

describe("fetchAvailability", () => {
	it("maps rows into AvailabilitySlot shape", async () => {
		vi.mocked(prisma.teacherAvailability.findMany).mockResolvedValue([
			{ id: "a1", teacherId: "t1", dayOfWeek: 1, startHour: 9, startMin: 0, endHour: 9, endMin: 30 },
		] as never);

		const result = await fetchAvailability("t1");

		expect(result).toEqual([{ dayOfWeek: 1, startHour: 9, startMin: 0, endHour: 9, endMin: 30 }]);
	});
});

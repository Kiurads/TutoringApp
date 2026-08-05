import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { fetchUserByEmail } from "./users.actions";
import { createNotification } from "@/app/lib/notifications";
import { fetchMessagesForClass, sendMessage } from "./messages.actions";

vi.mock("@/prisma", () => ({
	default: {
		class: { findUnique: vi.fn() },
		message: { findMany: vi.fn(), create: vi.fn() },
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("./users.actions", () => ({ fetchUserByEmail: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/lib/notifications", () => ({ createNotification: vi.fn() }));

const student = { id: "student1", role: "student" };
const teacher = { id: "teacher1", role: "teacher" };
const admin = { id: "admin1", role: "admin" };

const classWithTeacher = {
	studentId: "student1",
	teacherId: "teacher1",
	student: { firstName: "Stu", lastName: "Dent" },
	teacher: { firstName: "Tea", lastName: "Cher" },
};

const classWithoutTeacher = {
	studentId: "student1",
	teacherId: null,
	student: { firstName: "Stu", lastName: "Dent" },
	teacher: null,
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(auth).mockResolvedValue({ user: { email: "someone@test.com" } } as never);
});

describe("fetchMessagesForClass", () => {
	it("returns [] when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await fetchMessagesForClass("c1");

		expect(result).toEqual([]);
		expect(prisma.message.findMany).not.toHaveBeenCalled();
	});

	it("returns [] when the class has no teacher assigned yet", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(student as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithoutTeacher as never);

		const result = await fetchMessagesForClass("c1");

		expect(result).toEqual([]);
		expect(prisma.message.findMany).not.toHaveBeenCalled();
	});

	it("returns [] when the viewer isn't a participant", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "stranger", role: "student" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await fetchMessagesForClass("c1");

		expect(result).toEqual([]);
		expect(prisma.message.findMany).not.toHaveBeenCalled();
	});

	it("returns the thread, ordered, for the student participant", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(student as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);
		vi.mocked(prisma.message.findMany).mockResolvedValue([
			{
				id: "m1",
				senderId: "teacher1",
				body: "Hi!",
				createdAt: new Date("2026-01-01T10:00:00.000Z"),
				sender: { firstName: "Tea", lastName: "Cher" },
			},
		] as never);

		const result = await fetchMessagesForClass("c1");

		expect(prisma.message.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { classId: "c1" }, orderBy: { createdAt: "asc" } }),
		);
		expect(result).toEqual([
			{
				id: "m1",
				senderId: "teacher1",
				senderName: "Tea Cher",
				body: "Hi!",
				createdAt: "2026-01-01T10:00:00.000Z",
			},
		]);
	});

	it("allows an admin to read the thread even though they're not a participant", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(admin as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);
		vi.mocked(prisma.message.findMany).mockResolvedValue([] as never);

		const result = await fetchMessagesForClass("c1");

		expect(result).toEqual([]);
		expect(prisma.message.findMany).toHaveBeenCalled();
	});
});

describe("sendMessage", () => {
	it("errors when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await sendMessage("c1", "hello");

		expect(result).toEqual({ error: "You can't message on this class." });
		expect(prisma.message.create).not.toHaveBeenCalled();
	});

	it("errors when the viewer isn't a participant", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue({ id: "stranger", role: "student" } as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "hello");

		expect(result).toEqual({ error: "You can't message on this class." });
		expect(prisma.message.create).not.toHaveBeenCalled();
	});

	it("errors on an empty/whitespace-only message", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(student as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "   ");

		expect(result).toEqual({ error: "Message can't be empty." });
		expect(prisma.message.create).not.toHaveBeenCalled();
	});

	it("errors on an over-length message", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(student as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "x".repeat(2001));

		expect(result?.error).toMatch(/too long/);
		expect(prisma.message.create).not.toHaveBeenCalled();
	});

	it("creates the message and notifies the teacher when the student sends", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(student as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "  Hello there  ");

		expect(result).toEqual({});
		expect(prisma.message.create).toHaveBeenCalledWith({
			data: { classId: "c1", senderId: "student1", body: "Hello there" },
		});
		expect(createNotification).toHaveBeenCalledWith(
			"teacher1",
			"message_received",
			"New Message",
			expect.stringContaining("Stu"),
			"/main/teacher/classes/c1",
		);
	});

	it("creates the message and notifies the student when the teacher sends", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { email: "teacher@test.com" } } as never);
		vi.mocked(fetchUserByEmail).mockResolvedValue(teacher as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "On my way");

		expect(result).toEqual({});
		expect(createNotification).toHaveBeenCalledWith(
			"student1",
			"message_received",
			"New Message",
			expect.stringContaining("Tea"),
			"/main/student/classes/c1",
		);
	});

	it("does not notify anyone when an admin sends a message", async () => {
		vi.mocked(fetchUserByEmail).mockResolvedValue(admin as never);
		vi.mocked(prisma.class.findUnique).mockResolvedValue(classWithTeacher as never);

		const result = await sendMessage("c1", "Admin note");

		expect(result).toEqual({});
		expect(prisma.message.create).toHaveBeenCalledWith({
			data: { classId: "c1", senderId: "admin1", body: "Admin note" },
		});
		expect(createNotification).not.toHaveBeenCalled();
	});
});

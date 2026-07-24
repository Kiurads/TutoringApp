import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import { createAndSendVerificationEmail } from "@/app/lib/auth/verification";
import { registerTeacher } from "./register-teacher";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn(), create: vi.fn() },
		teacherSubject: { createMany: vi.fn() },
	},
}));

vi.mock("bcryptjs", () => ({
	default: { hash: vi.fn().mockResolvedValue("hashed") },
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/app/lib/auth/rate-limit", () => ({
	getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
	rateLimit: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock("@/app/lib/auth/verification", () => ({
	createAndSendVerificationEmail: vi.fn(),
}));

function formData(fields: Record<string, string | string[]>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		if (Array.isArray(value)) {
			for (const v of value) fd.append(key, v);
		} else {
			fd.append(key, value);
		}
	}
	return fd;
}

const validFields = {
	email: "teacher@test.com",
	password: "password123",
	firstName: "Ada",
	lastName: "Lovelace",
	phoneNumber: "",
	subjects: [] as string[],
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("registerTeacher", () => {
	it("sends the verification email and redirects to login on success", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockResolvedValue({ id: "t1", email: "teacher@test.com" } as never);

		await registerTeacher(undefined, formData(validFields));

		expect(createAndSendVerificationEmail).toHaveBeenCalledWith("teacher@test.com");
		expect(redirect).toHaveBeenCalledWith("/login");
	});

	it("does not create a user when the user already exists", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

		const result = await registerTeacher(undefined, formData(validFields));

		expect(result).toBe("User already exists");
		expect(redirect).not.toHaveBeenCalled();
	});
});

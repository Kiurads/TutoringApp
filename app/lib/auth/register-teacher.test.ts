import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

vi.mock("@/auth", () => ({ auth: vi.fn() }));

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
	confirmPassword: "password123",
	firstName: "Ada",
	lastName: "Lovelace",
	phoneNumber: "",
	subjects: [] as string[],
	agreedToTerms: "on",
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(auth).mockResolvedValue({ user: { role: "admin" } } as never);
});

describe("registerTeacher", () => {
	it("rejects the request when the caller is not an admin", async () => {
		vi.mocked(auth).mockResolvedValue({ user: { role: "teacher" } } as never);

		const result = await registerTeacher(undefined, formData(validFields));

		expect(result).toBe("You are not authorized to register a teacher account.");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
		expect(prisma.user.create).not.toHaveBeenCalled();
	});

	it("rejects the request when there is no session", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await registerTeacher(undefined, formData(validFields));

		expect(result).toBe("You are not authorized to register a teacher account.");
		expect(prisma.user.create).not.toHaveBeenCalled();
	});

	it("sends the verification email and redirects to login on success", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockResolvedValue({ id: "t1", email: "teacher@test.com" } as never);

		await registerTeacher(undefined, formData(validFields));

		expect(createAndSendVerificationEmail).toHaveBeenCalledWith("teacher@test.com");
		expect(redirect).toHaveBeenCalledWith("/login");
	});

	it("stores a null phoneNumber when left blank rather than an empty string", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockResolvedValue({ id: "t1", email: "teacher@test.com" } as never);

		await registerTeacher(undefined, formData(validFields));

		expect(prisma.user.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ phoneNumber: null }) }),
		);
	});

	it("does not create a user when the user already exists", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

		const result = await registerTeacher(undefined, formData(validFields));

		expect(result).toBe("User already exists");
		expect(redirect).not.toHaveBeenCalled();
	});

	// The bug this fix closes: a database failure's raw Error.message was
	// returned directly to the client instead of a generic message —
	// risking internal details (e.g. connection strings) leaking into the UI.
	it("returns a generic error instead of the raw failure on a database error", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockRejectedValue(
			new Error("connect ECONNREFUSED 10.0.0.5:3306"),
		);

		const result = await registerTeacher(undefined, formData(validFields));

		expect(result).toBe("Something went wrong. Please try again.");
	});

	it("rejects mismatched passwords without touching the database", async () => {
		const result = await registerTeacher(
			undefined,
			formData({ ...validFields, confirmPassword: "somethingElse" }),
		);

		expect(result).toBe("Passwords do not match");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("rejects a password shorter than 8 characters", async () => {
		const result = await registerTeacher(
			undefined,
			formData({ ...validFields, password: "short1", confirmPassword: "short1" }),
		);

		expect(result).toBe("Password must be at least 8 characters.");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("rejects registration when terms are not agreed to", async () => {
		const result = await registerTeacher(
			undefined,
			formData({ ...validFields, agreedToTerms: "" }),
		);

		expect(result).toBe("You must agree to the Terms of Service and Privacy Policy");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});
});

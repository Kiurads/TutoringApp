import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import { createAndSendVerificationEmail } from "@/app/lib/auth/verification";
import { registerStudent } from "./register-student";

vi.mock("@/prisma", () => ({
	default: {
		user: { findUnique: vi.fn(), create: vi.fn() },
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

function formData(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) fd.append(key, value);
	return fd;
}

const validFields = {
	email: "student@test.com",
	password: "password123",
	confirmPassword: "password123",
	firstName: "Grace",
	lastName: "Hopper",
	phoneNumber: "",
	agreedToTerms: "on",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("registerStudent", () => {
	it("sends the verification email and redirects to login on success", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockResolvedValue({ id: "s1", email: "student@test.com" } as never);

		await registerStudent(undefined, formData(validFields));

		expect(createAndSendVerificationEmail).toHaveBeenCalledWith("student@test.com");
		expect(redirect).toHaveBeenCalledWith("/login");
	});

	it("stores a null phoneNumber when left blank rather than an empty string", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.user.create).mockResolvedValue({ id: "s1", email: "student@test.com" } as never);

		await registerStudent(undefined, formData(validFields));

		expect(prisma.user.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: expect.objectContaining({ phoneNumber: null }) }),
		);
	});

	it("does not create a user when the user already exists", async () => {
		vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

		const result = await registerStudent(undefined, formData(validFields));

		expect(result).toBe("User already exists");
		expect(redirect).not.toHaveBeenCalled();
	});

	it("rejects mismatched passwords without touching the database", async () => {
		const result = await registerStudent(
			undefined,
			formData({ ...validFields, confirmPassword: "somethingElse" }),
		);

		expect(result).toBe("Passwords do not match");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("rejects registration when terms are not agreed to", async () => {
		const result = await registerStudent(
			undefined,
			formData({ ...validFields, agreedToTerms: "" }),
		);

		expect(result).toBe("You must agree to the Terms of Service and Privacy Policy");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it("rejects an invalid phone number", async () => {
		const result = await registerStudent(
			undefined,
			formData({ ...validFields, phoneNumber: "123" }),
		);

		expect(result).toBe("Please enter a valid phone number");
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});
});

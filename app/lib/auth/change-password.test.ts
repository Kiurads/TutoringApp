import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import { auth } from "@/auth";
import { changePassword } from "./change-password";

vi.mock("@/prisma", () => ({
	default: {
		user: {
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Map()),
}));

// Each test uses a distinct user id so the module-level rate limiter (a
// plain in-memory Map, shared across the whole test file) doesn't let one
// test's attempts count against another's.
let userCounter = 0;
function nextUserId() {
	userCounter += 1;
	return `user_${userCounter}`;
}

async function mockSessionAndUser(email: string, storedPasswordHash: string, id: string) {
	vi.mocked(auth).mockResolvedValue({ user: { email } } as never);
	vi.mocked(prisma.user.findUnique).mockResolvedValue({
		id,
		email,
		password: storedPasswordHash,
	} as never);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("changePassword", () => {
	it("returns an error when not authenticated", async () => {
		vi.mocked(auth).mockResolvedValue(null as never);

		const result = await changePassword({
			currentPassword: "whatever",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});

		expect(result.error).toBe("Not authenticated.");
	});

	it("rejects a new password shorter than 8 characters", async () => {
		const id = nextUserId();
		await mockSessionAndUser("a@test.com", await bcrypt.hash("oldpass123", 10), id);

		const result = await changePassword({
			currentPassword: "oldpass123",
			newPassword: "short",
			confirmPassword: "short",
		});

		expect(result.error).toMatch(/at least 8 characters/);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects mismatched new/confirm passwords", async () => {
		const id = nextUserId();
		await mockSessionAndUser("b@test.com", await bcrypt.hash("oldpass123", 10), id);

		const result = await changePassword({
			currentPassword: "oldpass123",
			newPassword: "newpassword123",
			confirmPassword: "different123",
		});

		expect(result.error).toBe("New passwords do not match.");
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects an incorrect current password", async () => {
		const id = nextUserId();
		await mockSessionAndUser("c@test.com", await bcrypt.hash("correctpass", 10), id);

		const result = await changePassword({
			currentPassword: "wrongpass",
			newPassword: "newpassword123",
			confirmPassword: "newpassword123",
		});

		expect(result.error).toBe("Current password is incorrect.");
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("rejects a new password identical to the current one", async () => {
		const id = nextUserId();
		await mockSessionAndUser("d@test.com", await bcrypt.hash("samepassword", 10), id);

		const result = await changePassword({
			currentPassword: "samepassword",
			newPassword: "samepassword",
			confirmPassword: "samepassword",
		});

		expect(result.error).toMatch(/different from the current one/);
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it("updates the password on success", async () => {
		const id = nextUserId();
		await mockSessionAndUser("e@test.com", await bcrypt.hash("oldpassword", 10), id);

		const result = await changePassword({
			currentPassword: "oldpassword",
			newPassword: "brandnewpassword",
			confirmPassword: "brandnewpassword",
		});

		expect(result.success).toBe(true);
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id },
			data: { password: expect.any(String) },
		});

		// The stored hash should actually verify against the new password.
		const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
		const newHash = (updateCall.data as { password: string }).password;
		expect(await bcrypt.compare("brandnewpassword", newHash)).toBe(true);
	});

	it("rate-limits repeated attempts for the same user", async () => {
		const id = nextUserId();
		await mockSessionAndUser("f@test.com", await bcrypt.hash("oldpassword", 10), id);

		let lastResult;
		for (let i = 0; i < 6; i++) {
			lastResult = await changePassword({
				currentPassword: "wrongpassword",
				newPassword: "newpassword123",
				confirmPassword: "newpassword123",
			});
		}

		expect(lastResult?.error).toMatch(/Too many attempts/);
	});
});

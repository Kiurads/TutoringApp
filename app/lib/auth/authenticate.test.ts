import { describe, it, expect, vi, beforeEach } from "vitest";
import { signIn } from "@/auth";
import { rateLimit, getClientIp } from "@/app/lib/auth/rate-limit";
import { authenticate } from "./authenticate";

const { MockAuthError } = vi.hoisted(() => ({
	MockAuthError: class extends Error {
		type: string;
		constructor(type: string) {
			super(type);
			this.type = type;
		}
	},
}));

vi.mock("@/auth", () => ({ signIn: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: MockAuthError }));
vi.mock("@/app/lib/auth/rate-limit", () => ({
	getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
	rateLimit: vi.fn().mockReturnValue({ allowed: true, retryAfterSeconds: 0 }),
}));

function formData(fields: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(fields)) fd.append(key, value);
	return fd;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(rateLimit).mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
	vi.mocked(getClientIp).mockResolvedValue("127.0.0.1");
});

describe("authenticate", () => {
	it("calls signIn with redirect:false and returns no error on success, leaving navigation to the client", async () => {
		vi.mocked(signIn).mockResolvedValue(undefined as never);

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "pw" }));

		expect(signIn).toHaveBeenCalledWith("credentials", {
			email: "t@test.com",
			password: "pw",
			redirect: false,
		});
		expect(result).toBeUndefined();
	});

	it("returns a friendly message on invalid credentials", async () => {
		vi.mocked(signIn).mockRejectedValue(new MockAuthError("CredentialsSignin"));

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "wrong" }));

		expect(result).toBe("Invalid credentials.");
	});

	it("returns a generic message for other auth errors", async () => {
		vi.mocked(signIn).mockRejectedValue(new MockAuthError("SomeOtherError"));

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "pw" }));

		expect(result).toBe("Something went wrong.");
	});

	it("rate-limits repeated attempts before ever calling signIn", async () => {
		vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 30 });

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "pw" }));

		expect(result).toBe("Too many login attempts. Please try again in 30 second(s).");
		expect(signIn).not.toHaveBeenCalled();
	});
});

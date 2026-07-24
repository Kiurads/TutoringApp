import { describe, it, expect, vi, beforeEach } from "vitest";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";
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
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
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
	it("calls signIn with redirect:false and its own redirect('/') on success, so middleware can route onward", async () => {
		vi.mocked(signIn).mockResolvedValue(undefined as never);

		await authenticate(undefined, formData({ email: "t@test.com", password: "pw" }));

		expect(signIn).toHaveBeenCalledWith("credentials", {
			email: "t@test.com",
			password: "pw",
			redirect: false,
		});
		expect(redirect).toHaveBeenCalledWith("/");
	});

	it("returns a friendly message on invalid credentials without redirecting", async () => {
		vi.mocked(signIn).mockRejectedValue(new MockAuthError("CredentialsSignin"));

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "wrong" }));

		expect(result).toBe("Invalid credentials.");
		expect(redirect).not.toHaveBeenCalled();
	});

	it("rate-limits repeated attempts before ever calling signIn", async () => {
		vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 30 });

		const result = await authenticate(undefined, formData({ email: "t@test.com", password: "pw" }));

		expect(result).toBe("Too many login attempts. Please try again in 30 second(s).");
		expect(signIn).not.toHaveBeenCalled();
	});
});

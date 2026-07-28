import { describe, it, expect } from "vitest";
import { canPayForClass } from "./can-pay-for-class";

describe("canPayForClass", () => {
	it("is payable when scheduled and unpaid", () => {
		expect(canPayForClass({ paid: false, status: "scheduled" })).toBe(true);
	});

	it("is payable when completed and unpaid", () => {
		expect(canPayForClass({ paid: false, status: "completed" })).toBe(true);
	});

	it("is not payable once already paid", () => {
		expect(canPayForClass({ paid: true, status: "scheduled" })).toBe(false);
	});

	it("is not payable while still requested", () => {
		expect(canPayForClass({ paid: false, status: "requested" })).toBe(false);
	});

	it("is not payable while cancelled or refused", () => {
		expect(canPayForClass({ paid: false, status: "cancelled" })).toBe(false);
		expect(canPayForClass({ paid: false, status: "refused" })).toBe(false);
	});

	it("is not payable when a pre-auth hold is outstanding, even if unpaid and scheduled", () => {
		expect(canPayForClass({ paid: false, status: "scheduled", hasPreAuth: true })).toBe(false);
	});

	it("ignores hasPreAuth when it's false or absent", () => {
		expect(canPayForClass({ paid: false, status: "scheduled", hasPreAuth: false })).toBe(true);
		expect(canPayForClass({ paid: false, status: "scheduled" })).toBe(true);
	});
});

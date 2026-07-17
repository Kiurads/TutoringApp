import { describe, it, expect } from "vitest";
import { decimalToHours, decimalStringToHours } from "./decimal-to-time";

describe("decimalToHours", () => {
  it("converts whole hours", () => {
    expect(decimalToHours(1)).toBe("01H00M");
    expect(decimalToHours(2)).toBe("02H00M");
    expect(decimalToHours(0)).toBe("00H00M");
  });

  it("converts half hours", () => {
    expect(decimalToHours(0.5)).toBe("00H30M");
    expect(decimalToHours(1.5)).toBe("01H30M");
    expect(decimalToHours(2.5)).toBe("02H30M");
  });

  it("converts quarter hours", () => {
    expect(decimalToHours(0.25)).toBe("00H15M");
    expect(decimalToHours(0.75)).toBe("00H45M");
    expect(decimalToHours(2.75)).toBe("02H45M");
  });

  it("pads single-digit hours and minutes with leading zeros", () => {
    expect(decimalToHours(1)).toBe("01H00M");
    expect(decimalToHours(9)).toBe("09H00M");
  });

  it("handles large hour values", () => {
    expect(decimalToHours(10)).toBe("10H00M");
    expect(decimalToHours(10.5)).toBe("10H30M");
  });
});

describe("decimalStringToHours", () => {
  it("converts valid decimal strings", () => {
    expect(decimalStringToHours("1")).toBe("01H00M");
    expect(decimalStringToHours("1.5")).toBe("01H30M");
    expect(decimalStringToHours("0.25")).toBe("00H15M");
    expect(decimalStringToHours("2.75")).toBe("02H45M");
  });

  it("throws on invalid string input", () => {
    expect(() => decimalStringToHours("abc")).toThrow(
      "Invalid input. Please provide a valid decimal number as a string."
    );
    expect(() => decimalStringToHours("")).toThrow();
  });

  it("handles numeric strings that look like integers", () => {
    expect(decimalStringToHours("2")).toBe("02H00M");
    expect(decimalStringToHours("0")).toBe("00H00M");
  });
});

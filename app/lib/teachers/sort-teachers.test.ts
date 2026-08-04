import { describe, it, expect } from "vitest";
import { sortTeachers } from "./sort-teachers";
import type { TeacherExtended } from "@/app/lib/types/teachers.types";

function makeTeacher(overrides: Partial<TeacherExtended> = {}): TeacherExtended {
	return {
		id: "t1",
		name: "Ana",
		email: "ana@test.com",
		bio: null,
		rating: "4.50",
		pricePerHour: "20",
		isOnline: false,
		subjects: [],
		subjectIds: [],
		availabilityDays: [],
		status: "Active",
		connectStatus: "active",
		...overrides,
	};
}

describe("sortTeachers", () => {
	it("returns the input order unchanged for the default sort", () => {
		const teachers = [makeTeacher({ id: "a" }), makeTeacher({ id: "b" })];

		const result = sortTeachers(teachers, "default");

		expect(result.map((t) => t.id)).toEqual(["a", "b"]);
	});

	it("sorts by price ascending", () => {
		const teachers = [
			makeTeacher({ id: "a", pricePerHour: "30" }),
			makeTeacher({ id: "b", pricePerHour: "10" }),
			makeTeacher({ id: "c", pricePerHour: "20" }),
		];

		const result = sortTeachers(teachers, "price-asc");

		expect(result.map((t) => t.id)).toEqual(["b", "c", "a"]);
	});

	it("sorts by price descending", () => {
		const teachers = [
			makeTeacher({ id: "a", pricePerHour: "30" }),
			makeTeacher({ id: "b", pricePerHour: "10" }),
			makeTeacher({ id: "c", pricePerHour: "20" }),
		];

		const result = sortTeachers(teachers, "price-desc");

		expect(result.map((t) => t.id)).toEqual(["a", "c", "b"]);
	});

	it("sorts by rating descending, treating unrated teachers as lowest", () => {
		const teachers = [
			makeTeacher({ id: "a", rating: "3.00" }),
			makeTeacher({ id: "b", rating: "No Reviews" }),
			makeTeacher({ id: "c", rating: "4.80" }),
		];

		const result = sortTeachers(teachers, "rating-desc");

		expect(result.map((t) => t.id)).toEqual(["c", "a", "b"]);
	});

	it("sorts by name alphabetically", () => {
		const teachers = [
			makeTeacher({ id: "a", name: "Carlos" }),
			makeTeacher({ id: "b", name: "Ana" }),
			makeTeacher({ id: "c", name: "Beatriz" }),
		];

		const result = sortTeachers(teachers, "name-asc");

		expect(result.map((t) => t.id)).toEqual(["b", "c", "a"]);
	});

	it("does not mutate the input array", () => {
		const teachers = [
			makeTeacher({ id: "a", pricePerHour: "30" }),
			makeTeacher({ id: "b", pricePerHour: "10" }),
		];

		sortTeachers(teachers, "price-asc");

		expect(teachers.map((t) => t.id)).toEqual(["a", "b"]);
	});
});

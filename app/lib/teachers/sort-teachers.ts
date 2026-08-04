import { TeacherExtended } from "@/app/lib/types/teachers.types";

export type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "name-asc";

export const SORT_LABELS: Record<SortOption, string> = {
	default: "Recommended",
	"price-asc": "Price: Low to High",
	"price-desc": "Price: High to Low",
	"rating-desc": "Rating: High to Low",
	"name-asc": "Name: A to Z",
};

// "No Reviews" isn't a number — treat unrated teachers as lowest-rated
// rather than letting them sort arbitrarily (or crash on NaN comparisons).
function ratingValue(rating: string): number {
	const parsed = parseFloat(rating);
	return Number.isNaN(parsed) ? -1 : parsed;
}

export function sortTeachers(teachers: TeacherExtended[], sortBy: SortOption): TeacherExtended[] {
	if (sortBy === "default") return teachers;
	const sorted = [...teachers];
	switch (sortBy) {
		case "price-asc":
			sorted.sort((a, b) => parseFloat(a.pricePerHour) - parseFloat(b.pricePerHour));
			break;
		case "price-desc":
			sorted.sort((a, b) => parseFloat(b.pricePerHour) - parseFloat(a.pricePerHour));
			break;
		case "rating-desc":
			sorted.sort((a, b) => ratingValue(b.rating) - ratingValue(a.rating));
			break;
		case "name-asc":
			sorted.sort((a, b) => a.name.localeCompare(b.name));
			break;
	}
	return sorted;
}

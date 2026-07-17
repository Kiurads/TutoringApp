export interface TeacherDetails {
	id: string;
	name: string;
	email: string;
	bio: string | null;
	rating: string;
	pricePerHour: string;
	isOnline: boolean;
	avatarOptions?: string | null;
}

export interface TeacherExtended extends TeacherDetails {
	subjects: string[];       // subject names (display)
	subjectIds: string[];     // subject IDs (fit score)
	availabilityDays: number[]; // unique dayOfWeek values (fit score)
	status: "Active" | "Pending" | "Inactive";
	fitScore?: number | null;
}

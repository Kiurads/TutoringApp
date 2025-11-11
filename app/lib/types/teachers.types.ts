export interface TeacherDetails {
	id: string;
	name: string;
	email: string;
	bio: string | null;
	rating: string;
	pricePerHour: string;
}

export interface TeacherExtended extends TeacherDetails {
	subjects: string[];
	status: "Active" | "Pending" | "Inactive";
}

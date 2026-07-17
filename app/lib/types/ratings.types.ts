export interface Rating {
	id: string;
	studentId: string;
	studentName: string;
	teacherId: string;
	classId: string;
	rating: number;
	review: string | null;
	createdAt: Date;
}

import { fetchTeachers } from "@/app/lib/actions/teachers.actions";
import TeacherCard from "./teacher-card";

export default async function TeacherGrid() {
	const teachers = await fetchTeachers();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
			{teachers.map((teacher) => (
				<TeacherCard key={teacher.id} teacher={teacher} />
			))}
		</div>
	);
}

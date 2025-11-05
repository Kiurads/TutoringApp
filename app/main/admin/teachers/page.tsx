import { fetchTeachersExtended } from "@/app/lib/actions/teachers.actions";
import TeachersTable from "@/app/ui/main/teachers/teachers-table";

export default async function TeachersPage() {
	// Mock data – replace with fetched teachers
	const teachers = await fetchTeachersExtended();

	return <TeachersTable initialTeachers={teachers} />;
}

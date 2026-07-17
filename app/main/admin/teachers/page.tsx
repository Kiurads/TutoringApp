import { fetchTeachersExtended } from "@/app/lib/actions/teachers.actions";
import TeachersTable from "@/app/ui/main/teachers/teachers-table";

export default async function TeachersPage() {
	const teachers = await fetchTeachersExtended();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Teachers</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{teachers.length} registered teacher{teachers.length !== 1 ? "s" : ""}.
				</p>
			</div>
			<TeachersTable initialTeachers={teachers} />
		</div>
	);
}

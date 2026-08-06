import { fetchTeachersExtended } from "@/app/lib/actions/teachers.actions";
import TeachersTable from "@/app/ui/main/teachers/teachers-table";
import ToastNotification from "@/app/ui/toast-notification";

export default async function TeachersPage({
	searchParams,
}: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const [teachers, { toast }] = await Promise.all([
		fetchTeachersExtended(),
		searchParams,
	]);

	return (
		<div className="flex flex-col gap-6">
			<ToastNotification toast={toast} />
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

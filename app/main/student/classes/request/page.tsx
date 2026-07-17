import RequestClassForm from "@/app/ui/main/classes/create/student/create-class-form";
import { fetchTeacherById } from "@/app/lib/actions/teachers.actions";
import { fetchSubjectsByTeacherId } from "@/app/lib/actions/subjects.actions";
import { fetchStudentStoreState } from "@/app/lib/actions/store.actions";

export default async function ClassesPage(props: {
	searchParams: Promise<{ teacher?: string; startTime?: string; duration?: string }>;
}) {
	const { teacher: teacherId, startTime, duration } = await props.searchParams;

	let initialTeacher:
		| { id: string; name: string; subjects: { id: string; name: string }[] }
		| undefined;

	if (teacherId) {
		try {
			const [teacher, subjects] = await Promise.all([
				fetchTeacherById(teacherId),
				fetchSubjectsByTeacherId(teacherId),
			]);
			initialTeacher = { id: teacher.id, name: teacher.name, subjects };
		} catch {
			// Teacher not found — fall back to open form
		}
	}

	const { studyBoostActive, priorityBooking } = await fetchStudentStoreState();

	return (
		<div className="flex min-h-[80vh] items-center justify-center py-8">
			<RequestClassForm
				initialTeacher={initialTeacher}
				initialStartTime={startTime}
				initialDuration={duration ? parseFloat(duration) : undefined}
				studyBoostActive={studyBoostActive}
				priorityBookingActive={priorityBooking}
			/>
		</div>
	);
}

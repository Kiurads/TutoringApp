import { auth } from "@/auth";
import { fetchTeachersExtended } from "@/app/lib/actions/teachers.actions";
import { fetchStudentClassHistory } from "@/app/lib/actions/students.actions";
import { computeFitScore } from "@/app/lib/teachers/fit-score";
import TeacherBrowser from "@/app/ui/main/teachers/teacher-browser";

export default async function TeachersPage() {
	const [teachers, session] = await Promise.all([
		fetchTeachersExtended(),
		auth(),
	]);

	// Fetch student's completed class history for fit score computation
	const history =
		session?.user?.email
			? await fetchStudentClassHistory(session.user.email)
			: [];

	// Attach fit scores
	const scored = teachers.map((t) => ({
		...t,
		fitScore: computeFitScore(
			{ id: t.id, rating: t.rating, subjectIds: t.subjectIds, availabilityDays: t.availabilityDays },
			history,
		),
	}));

	// Sort: fit score desc → online first → name
	scored.sort((a, b) => {
		const sa = a.fitScore ?? -1;
		const sb = b.fitScore ?? -1;
		if (sa !== sb) return sb - sa;
		if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
		return a.name.localeCompare(b.name);
	});

	const subjects = Array.from(
		new Set(scored.flatMap((t) => t.subjects)),
	).sort();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Find a Teacher</h1>
				<p className="text-base-content/60 mt-1">
					Browse available tutors and book a session
				</p>
			</div>
			<TeacherBrowser teachers={scored} subjects={subjects} hasHistory={history.length > 0} />
		</div>
	);
}

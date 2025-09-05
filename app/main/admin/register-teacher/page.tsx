import { fetchSubjects } from "@/app/lib/actions/subjects.actions";
import RegisterTeacherForm from "@/app/ui/register/teacher/register-teacher-form";

export default async function Register() {
	const subjects = await fetchSubjects();
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<RegisterTeacherForm subjects={subjects} />
				</div>
			</div>
		</div>
	);
}

import RegisterStudentForm from "@/app/ui/register/student/register-student-form";

export default function Register() {
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<RegisterStudentForm />
				</div>
			</div>
		</div>
	);
}

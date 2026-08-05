import type { Metadata } from "next";
import RegisterStudentForm from "@/app/ui/register/student/register-student-form";

export const metadata: Metadata = {
	title: "Become a Student — The Learning Nexus",
	description: "Sign up as a student on The Learning Nexus and start booking one-on-one tutoring sessions with expert teachers.",
};

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

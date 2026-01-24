import RequestClassForm from "@/app/ui/main/classes/create/teacher/create-class-form";

export default function ClassesPage() {
	return (
		<div className="hero bg-base-100 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<RequestClassForm />
				</div>
			</div>
		</div>
	);
}

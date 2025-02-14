import TeacherGrid from "@/app/ui/main/teachers/teacher-grid";

export default function TeachersPage() {
	return (
		<div className="min-h-screen p-6">
			<h1 className="text-2xl font-bold mb-6">Our Teachers</h1>
			<TeacherGrid />
		</div>
	);
}

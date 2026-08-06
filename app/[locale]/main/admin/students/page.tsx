import prisma from "@/prisma";
import StudentsTable from "@/app/ui/main/students/students-table";

async function getStudents() {
	return prisma.user.findMany({
		where: { role: "student" },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			avatarOptions: true,
			createdAt: true,
			_count: { select: { classesAsStudent: true } },
		},
	});
}

export default async function StudentsPage() {
	const students = await getStudents();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Students</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{students.length} registered student{students.length !== 1 ? "s" : ""}
				</p>
			</div>

			<StudentsTable initialStudents={students} />
		</div>
	);
}

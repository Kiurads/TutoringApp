import Link from "next/link";
import { fetchSubjects } from "@/app/lib/actions/subjects.actions";

export default async function SubjectsPage() {
	const subjects = await fetchSubjects();

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Subjects</h1>
				<Link
					href="/main/admin/subjects/create"
					className="btn btn-primary"
				>
					+ Add Subject
				</Link>
			</div>

			<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Name</th>
							<th>Teachers</th>
						</tr>
					</thead>
					<tbody>
						{subjects.map((s) => (
							<tr key={s.id}>
								<td>{s.name}</td>
								<td>{s.teacherCount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

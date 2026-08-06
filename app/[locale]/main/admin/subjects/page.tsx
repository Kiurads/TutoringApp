import Link from "next/link";
import { fetchSubjects } from "@/app/lib/actions/subjects.actions";

export default async function SubjectsPage() {
	const subjects = await fetchSubjects();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Subjects</h1>
					<p className="text-base-content/60 text-sm mt-1">
						{subjects.length} subject{subjects.length !== 1 ? "s" : ""} available on the platform.
					</p>
				</div>
				<Link href="/main/admin/subjects/create" className="btn btn-primary gap-2">
					<i className="fa-solid fa-plus"></i> Add Subject
				</Link>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					{subjects.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 gap-3 text-base-content/30">
							<i className="fa-solid fa-book-open text-4xl"></i>
							<p className="text-sm">No subjects yet.</p>
							<Link href="/main/admin/subjects/create" className="btn btn-primary btn-sm">
								Add the first subject
							</Link>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>Name</th>
										<th>Teachers</th>
									</tr>
								</thead>
								<tbody>
									{subjects.map((s) => (
										<tr key={s.id} className="hover">
											<td className="font-medium capitalize">{s.name}</td>
											<td>
												<span className="badge badge-ghost badge-sm">{s.teacherCount}</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

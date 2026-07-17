import { ClassData } from "@/app/lib/types/classes.types";
import ClassStatusBadge from "./class-status-badge";

export default function ClassesTable({ classes }: { classes: ClassData[] }) {
	if (classes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-2 text-base-content/30">
				<i className="fa-solid fa-school text-4xl"></i>
				<p className="text-sm">No classes yet.</p>
			</div>
		);
	}

	return (
		<div className="card bg-base-200 shadow overflow-hidden">
			<div className="overflow-x-auto">
				<table className="table table-sm">
					<thead>
						<tr>
							<th>Student</th>
							<th>Teacher</th>
							<th>Subject</th>
							<th>Date</th>
							<th>Status</th>
							<th>Paid</th>
						</tr>
					</thead>
					<tbody>
						{classes.map((c) => (
							<tr key={c.id} className="hover">
								<td className="capitalize">{c.student.name}</td>
								<td className="capitalize">
									{c.teacher?.name ?? (
										<span className="text-base-content/40 text-xs italic">Unassigned</span>
									)}
								</td>
								<td className="capitalize">{c.subject}</td>
								<td className="text-xs whitespace-nowrap text-base-content/60">
									{new Date(c.startTime).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})}
								</td>
								<td>
									<ClassStatusBadge status={c.status} />
								</td>
								<td>
									{c.paid ? (
										<span className="badge badge-success badge-sm">Yes</span>
									) : (
										<span className="badge badge-ghost badge-sm">No</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

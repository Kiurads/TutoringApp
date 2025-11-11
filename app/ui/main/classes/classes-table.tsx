import { ClassData } from "@/app/lib/types/classes.types";

export default function ClassesTable(props: { classes: ClassData[] }) {
	const { classes } = props;

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Classes</h1>

			<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
				<table className="table table-zebra w-full">
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
							<tr key={c.id}>
								<td>{c.student.name}</td>
								<td>{c.teacher.name}</td>
								<td>{c.subject}</td>
								<td>{c.startTime}</td>
								<td>
									<span className="badge badge-info">
										{c.status.toUpperCase()}
									</span>
								</td>
								<td>
									{c.paid ? (
										<span className="badge badge-success">
											Yes
										</span>
									) : (
										<span className="badge badge-warning">
											No
										</span>
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

"use client";

export default function ClassesPage() {
	const classes = [
		{
			id: 1,
			student: "Ana Lopes",
			teacher: "Maria Silva",
			subject: "Math",
			date: "2025-09-20",
			status: "Requested",
			paid: false,
		},
		{
			id: 2,
			student: "Rui Santos",
			teacher: "João Costa",
			subject: "English",
			date: "2025-09-21",
			status: "Scheduled",
			paid: true,
		},
	];

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
								<td>{c.student}</td>
								<td>{c.teacher}</td>
								<td>{c.subject}</td>
								<td>{c.date}</td>
								<td>
									<span className="badge badge-info">
										{c.status}
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

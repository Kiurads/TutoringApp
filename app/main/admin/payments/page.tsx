export default function PaymentsPage() {
	const payments = [
		{
			id: 1,
			student: "Ana Lopes",
			teacher: "Maria Silva",
			class: "Math Class",
			amount: 30,
			date: "2025-09-17",
		},
	];

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Payments</h1>

			<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Student</th>
							<th>Teacher</th>
							<th>Class</th>
							<th>Amount</th>
							<th>Date</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => (
							<tr key={p.id}>
								<td>{p.student}</td>
								<td>{p.teacher}</td>
								<td>{p.class}</td>
								<td>€{p.amount}</td>
								<td>{p.date}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

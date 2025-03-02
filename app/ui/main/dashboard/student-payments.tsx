interface Payment {
	id: string;
	amount: number;
	teacherName: string;
	date: Date;
}

export default function StudentPayments({ payments }: { payments: Payment[] }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-base-content bg-base-100">
			<h2 className="text-center text-lg font-bold py-4">
				Payment History{" "}
				<div className="badge badge-outline">{payments.length}</div>
			</h2>

			{payments.length === 0 ? (
				<div className="text-center text-lg py-4 text-gray-500">
					No payments found{" "}
					<i className="fa-solid fa-face-laugh-wink"></i>
				</div>
			) : (
				<table className="min-w-full divide-y-2 divide-base-300 bg-base text-sm table-auto">
					<thead className="ltr:text-left rtl:text-right">
						<tr>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Teacher
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Amount
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Date
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-base-300">
						{payments.map((payment) => (
							<tr
								key={payment.id}
								className="hover:bg-base-200 transition-all"
							>
								<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content capitalize">
									{payment.teacherName}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{payment.amount.toFixed(2)}€
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{payment.date.toUTCString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

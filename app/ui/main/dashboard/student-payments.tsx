interface Payment {
	id: string;
	amount: number;
	teacherName: string;
	date: Date;
}

export default function StudentPayments({ payments }: { payments: Payment[] }) {
	const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

	return (
		<div className="rounded-lg border border-base-300 bg-base-100">
			<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">Payment History</h2>
				{payments.length > 0 && (
					<span className="badge badge-ghost">{payments.length}</span>
				)}
			</div>

			{payments.length > 0 && (
				<div className="flex items-center justify-between px-4 py-3 bg-base-200 border-b border-base-300">
					<span className="text-sm text-base-content/60">Total spent</span>
					<span className="font-bold text-lg">{totalSpent.toFixed(2)}€</span>
				</div>
			)}

			{payments.length === 0 ? (
				<p className="text-center py-10 text-base-content/50">
					No payments yet.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full divide-y divide-base-300 text-sm">
						<thead>
							<tr className="bg-base-200">
								<th className="px-4 py-2 font-medium text-base-content text-left">Teacher</th>
								<th className="px-4 py-2 font-medium text-base-content text-left">Amount</th>
								<th className="px-4 py-2 font-medium text-base-content text-left">Date</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-base-300">
							{payments.map((payment) => (
								<tr key={payment.id} className="hover:bg-base-200 transition-colors">
									<td className="px-4 py-2 font-medium text-base-content capitalize">
										{payment.teacherName}
									</td>
									<td className="px-4 py-2 text-base-content">
										{payment.amount.toFixed(2)}€
									</td>
									<td className="px-4 py-2 text-base-content text-xs whitespace-nowrap">
										{payment.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

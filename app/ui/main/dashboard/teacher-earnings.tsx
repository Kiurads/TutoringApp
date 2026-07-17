import { Decimal } from "@prisma/client/runtime/library";

interface Payment {
	id: string;
	amount: Decimal;
	studentName: string;
	date: Date;
}

export default function TeacherEarnings({ payments }: { payments: Payment[] }) {
	const totalEarnings = payments.reduce(
		(sum, payment) => sum + payment.amount.toNumber(),
		0,
	);

	const now = new Date();
	const thisMonthEarnings = payments
		.filter((p) => {
			const d = new Date(p.date);
			return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
		})
		.reduce((sum, p) => sum + p.amount.toNumber(), 0);

	return (
		<div className="rounded-lg border border-base-300 bg-base-100">
			<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">Earnings</h2>
				{payments.length > 0 && (
					<span className="badge badge-ghost">{payments.length} payments</span>
				)}
			</div>

			{payments.length > 0 && (
				<div className="grid grid-cols-2 divide-x divide-base-300 border-b border-base-300">
					<div className="px-4 py-3">
						<p className="text-xs text-base-content/60">Total earned</p>
						<p className="text-xl font-bold text-success">{totalEarnings.toFixed(2)}€</p>
					</div>
					<div className="px-4 py-3">
						<p className="text-xs text-base-content/60">This month</p>
						<p className="text-xl font-bold">{thisMonthEarnings.toFixed(2)}€</p>
					</div>
				</div>
			)}

			{payments.length === 0 ? (
				<p className="text-center py-10 text-base-content/50">
					No earnings yet.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full divide-y divide-base-300 text-sm">
						<thead>
							<tr className="bg-base-200">
								<th className="px-4 py-2 font-medium text-base-content text-left">Student</th>
								<th className="px-4 py-2 font-medium text-base-content text-left">Amount</th>
								<th className="px-4 py-2 font-medium text-base-content text-left">Date</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-base-300">
							{payments.map((payment) => (
								<tr key={payment.id} className="hover:bg-base-200 transition-colors">
									<td className="px-4 py-2 font-medium text-base-content capitalize">
										{payment.studentName}
									</td>
									<td className="px-4 py-2 text-base-content">
										{payment.amount.toNumber().toFixed(2)}€
									</td>
									<td className="px-4 py-2 text-base-content text-xs whitespace-nowrap">
										{payment.date.toUTCString()}
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

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

	return (
		<div className="overflow-x-auto rounded-lg border border-base-content bg-base-100">
			<h2 className="text-center text-lg font-bold py-4">
				Earnings{" "}
				<div className="badge badge-outline">{payments.length}</div>
			</h2>

			{/* Total Earnings Summary */}
			<div className="px-4 py-3 bg-base-200 border-b border-base-300">
				<div className="flex justify-between items-center">
					<span className="text-sm font-medium">Total Earnings:</span>
					<span className="text-xl font-bold text-success">
						{totalEarnings.toFixed(2)}€
					</span>
				</div>
			</div>

			{payments.length === 0 ? (
				<div className="text-center text-lg py-4 text-gray-500">
					No earnings yet <i className="fa-solid fa-face-smile"></i>
				</div>
			) : (
				<table className="min-w-full divide-y-2 divide-base-300 bg-base text-sm table-auto">
					<thead className="ltr:text-left rtl:text-right">
						<tr>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Student
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
									{payment.studentName}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{payment.amount.toNumber().toFixed(2)}€
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

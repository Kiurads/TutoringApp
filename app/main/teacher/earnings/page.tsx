import { fetchPaymentsByTeacherId } from "@/app/lib/actions/paymets.actions";
import { auth } from "@/auth";

export default async function TeacherEarningsPage() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const userEmail = session.user.email;
	const payments = await fetchPaymentsByTeacherId(userEmail);

	// Calculate statistics
	const totalEarnings = payments.reduce(
		(sum, payment) => sum + payment.amount.toNumber(),
		0,
	);
	const thisMonthEarnings = payments
		.filter((payment) => {
			const paymentDate = new Date(payment.date);
			const now = new Date();
			return (
				paymentDate.getMonth() === now.getMonth() &&
				paymentDate.getFullYear() === now.getFullYear()
			);
		})
		.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

	return (
		<div className="w-full px-4 sm:px-8 lg:px-12 py-4">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Earnings</h1>
				<p className="text-base-content/70">
					Track your teaching income and payment history
				</p>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-primary">
							<i className="fa-solid fa-euro-sign text-3xl"></i>
						</div>
						<div className="stat-title">Total Earnings</div>
						<div className="stat-value text-primary">
							{totalEarnings.toFixed(2)}€
						</div>
						<div className="stat-desc">All time</div>
					</div>
				</div>

				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-secondary">
							<i className="fa-solid fa-calendar-month text-3xl"></i>
						</div>
						<div className="stat-title">This Month</div>
						<div className="stat-value text-secondary">
							{thisMonthEarnings.toFixed(2)}€
						</div>
						<div className="stat-desc">
							{new Date().toLocaleDateString("en-US", {
								month: "long",
							})}
						</div>
					</div>
				</div>

				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-accent">
							<i className="fa-solid fa-receipt text-3xl"></i>
						</div>
						<div className="stat-title">Total Payments</div>
						<div className="stat-value text-accent">
							{payments.length}
						</div>
						<div className="stat-desc">Completed transactions</div>
					</div>
				</div>
			</div>

			{/* Payment History Table */}
			<div className="overflow-x-auto rounded-lg border border-base-content bg-base-100 shadow-lg">
				<h2 className="text-center text-xl font-bold py-4 border-b border-base-300">
					Payment History
				</h2>

				{payments.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-6xl mb-4">
							<i className="fa-solid fa-hand-holding-dollar text-base-content/20"></i>
						</div>
						<p className="text-xl text-base-content/70">
							No earnings yet
						</p>
						<p className="text-base-content/50">
							Your payment history will appear here
						</p>
					</div>
				) : (
					<table className="min-w-full divide-y-2 divide-base-300 bg-base text-sm table-auto">
						<thead className="ltr:text-left rtl:text-right bg-base-200">
							<tr>
								<th className="whitespace-nowrap px-4 py-3 font-medium text-base-content text-left">
									Student
								</th>
								<th className="whitespace-nowrap px-4 py-3 font-medium text-base-content text-left">
									Amount
								</th>
								<th className="whitespace-nowrap px-4 py-3 font-medium text-base-content text-left">
									Date
								</th>
								<th className="whitespace-nowrap px-4 py-3 font-medium text-base-content text-left">
									Transaction ID
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-base-300">
							{payments.map((payment) => (
								<tr
									key={payment.id}
									className="hover:bg-base-200 transition-all"
								>
									<td className="whitespace-nowrap px-4 py-3 font-medium text-base-content capitalize">
										{payment.studentName}
									</td>
									<td className="whitespace-nowrap px-4 py-3 text-success font-semibold">
										+{payment.amount.toNumber().toFixed(2)}€
									</td>
									<td className="whitespace-nowrap px-4 py-3 text-base-content">
										{new Date(
											payment.date,
										).toLocaleDateString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</td>
									<td className="whitespace-nowrap px-4 py-3 text-base-content/70 font-mono text-xs">
										{payment.id.slice(0, 8)}...
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

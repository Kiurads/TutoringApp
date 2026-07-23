import { fetchPaymentsByTeacherId } from "@/app/lib/actions/paymets.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MonthlyEarningsChart from "@/app/ui/main/earnings/monthly-earnings-chart";
import StudentBreakdownChart from "@/app/ui/main/earnings/student-breakdown-chart";

const PAYOUT_STATUS_BADGE: Record<string, string> = {
	transferred: "badge-success",
	pending: "badge-warning",
	failed: "badge-error",
	not_applicable: "badge-ghost",
};

const PAYOUT_STATUS_LABEL: Record<string, string> = {
	transferred: "Paid out",
	pending: "Pending",
	failed: "Failed",
	not_applicable: "—",
};

export default async function TeacherEarningsPage() {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const userEmail = session.user.email!;
	const payments = await fetchPaymentsByTeacherId(userEmail);

	// "Earnings" means what the teacher actually receives — net of the
	// platform's commission — not the gross amount the student paid.
	const paymentsForCharts = payments.map((p) => ({
		amount: p.teacherPayoutAmount,
		studentName: p.studentName,
		date: p.date,
	}));

	const totalEarnings = paymentsForCharts.reduce((sum, p) => sum + p.amount, 0);
	const totalPlatformFee = payments.reduce((sum, p) => sum + p.platformFeeAmount, 0);

	const now = new Date();
	const thisMonthEarnings = paymentsForCharts
		.filter((p) => {
			const d = new Date(p.date);
			return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
		})
		.reduce((sum, p) => sum + p.amount, 0);

	const uniqueStudents = new Set(payments.map((p) => p.studentName)).size;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Earnings</h1>
					<p className="text-base-content/60 text-sm mt-1">
						Track your teaching income and payment history
					</p>
				</div>
				<Link href="/main/teacher/payouts" className="btn btn-outline btn-sm shrink-0">
					<i className="fa-solid fa-money-bill-transfer" /> Payouts
				</Link>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-primary">
							<i className="fa-solid fa-euro-sign text-3xl"></i>
						</div>
						<div className="stat-title">Total Earned</div>
						<div className="stat-value text-primary">{totalEarnings.toFixed(2)}€</div>
						<div className="stat-desc">
							All time — of which {totalPlatformFee.toFixed(2)}€ was the platform fee
						</div>
					</div>
				</div>

				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-secondary">
							<i className="fa-solid fa-calendar-month text-3xl"></i>
						</div>
						<div className="stat-title">This Month</div>
						<div className="stat-value text-secondary">{thisMonthEarnings.toFixed(2)}€</div>
						<div className="stat-desc">
							{now.toLocaleDateString("en-US", { month: "long" })}
						</div>
					</div>
				</div>

				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-figure text-accent">
							<i className="fa-solid fa-user-graduate text-3xl"></i>
						</div>
						<div className="stat-title">Students</div>
						<div className="stat-value text-accent">{uniqueStudents}</div>
						<div className="stat-desc">{payments.length} total payments</div>
					</div>
				</div>
			</div>

			{/* Charts */}
			{payments.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
					<div className="lg:col-span-2">
						<MonthlyEarningsChart payments={paymentsForCharts} />
					</div>
					<div>
						<StudentBreakdownChart payments={paymentsForCharts} />
					</div>
				</div>
			)}

			{/* Payment history table */}
			<div className="rounded-lg border border-base-300 bg-base-100">
				<div className="px-4 py-3 border-b border-base-300">
					<h2 className="text-lg font-semibold">Payment History</h2>
				</div>

				{payments.length === 0 ? (
					<div className="text-center py-16">
						<div className="text-6xl mb-4 text-base-content/20">
							<i className="fa-solid fa-hand-holding-dollar"></i>
						</div>
						<p className="text-lg text-base-content/60">No earnings yet</p>
						<p className="text-sm text-base-content/40 mt-1">
							Your payment history will appear here once students pay for classes.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full divide-y divide-base-300 text-sm">
							<thead>
								<tr className="bg-base-200">
									<th className="px-4 py-3 font-medium text-base-content text-left">Student</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">You received</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Payout</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Date</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Transaction ID</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-base-300">
								{payments.map((payment) => (
									<tr key={payment.id} className="hover:bg-base-200 transition-colors">
										<td className="px-4 py-3 font-medium text-base-content capitalize">
											{payment.studentName}
										</td>
										<td className="px-4 py-3 text-success font-semibold">
											+{payment.teacherPayoutAmount.toFixed(2)}€
											<span className="block text-xs font-normal text-base-content/40">
												of {payment.amount.toNumber().toFixed(2)}€ paid
											</span>
										</td>
										<td className="px-4 py-3">
											<span className={`badge badge-sm ${PAYOUT_STATUS_BADGE[payment.payoutStatus]}`}>
												{PAYOUT_STATUS_LABEL[payment.payoutStatus]}
											</span>
										</td>
										<td className="px-4 py-3 text-base-content text-xs whitespace-nowrap">
											{new Date(payment.date).toLocaleDateString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</td>
										<td className="px-4 py-3 text-base-content/50 font-mono text-xs">
											{payment.id.slice(0, 8)}…
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

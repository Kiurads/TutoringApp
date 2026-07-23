import prisma from "@/prisma";

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

async function getPayments() {
	return prisma.payment.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			amount: true,
			platformFeeAmount: true,
			teacherPayoutAmount: true,
			payoutStatus: true,
			createdAt: true,
			student: { select: { firstName: true, lastName: true } },
			teacher: { select: { firstName: true, lastName: true } },
			class: { select: { subject: { select: { name: true } } } },
		},
	});
}

export default async function PaymentsPage() {
	const payments = await getPayments();
	const grossVolume = payments.reduce((s, p) => s + p.amount.toNumber(), 0);
	const platformRevenue = payments.reduce((s, p) => s + (p.platformFeeAmount?.toNumber() ?? 0), 0);
	const teacherPayouts = payments.reduce((s, p) => s + (p.teacherPayoutAmount?.toNumber() ?? p.amount.toNumber()), 0);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Payments</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{payments.length} transaction{payments.length !== 1 ? "s" : ""}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-title">Gross volume</div>
						<div className="stat-value text-lg">€{grossVolume.toFixed(2)}</div>
						<div className="stat-desc">Total charged to students</div>
					</div>
				</div>
				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-title">Platform revenue</div>
						<div className="stat-value text-lg text-primary">€{platformRevenue.toFixed(2)}</div>
						<div className="stat-desc">Commission taken</div>
					</div>
				</div>
				<div className="stats shadow bg-base-200">
					<div className="stat">
						<div className="stat-title">Teacher payouts</div>
						<div className="stat-value text-lg text-success">€{teacherPayouts.toFixed(2)}</div>
						<div className="stat-desc">Owed or paid to teachers</div>
					</div>
				</div>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					{payments.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-12">No payments recorded yet.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>Student</th>
										<th>Teacher</th>
										<th>Subject</th>
										<th>Amount</th>
										<th>Payout</th>
										<th>Date</th>
										<th>ID</th>
									</tr>
								</thead>
								<tbody>
									{payments.map((p) => (
										<tr key={p.id} className="hover">
											<td className="capitalize">{p.student.firstName} {p.student.lastName}</td>
											<td className="capitalize">{p.teacher.firstName} {p.teacher.lastName}</td>
											<td className="capitalize text-sm">{p.class.subject.name}</td>
											<td className="font-semibold text-success">€{p.amount.toNumber().toFixed(2)}</td>
											<td>
												<span className={`badge badge-sm ${PAYOUT_STATUS_BADGE[p.payoutStatus]}`}>
													{PAYOUT_STATUS_LABEL[p.payoutStatus]}
												</span>
											</td>
											<td className="text-xs text-base-content/50 whitespace-nowrap">
												{new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
											</td>
											<td className="font-mono text-xs text-base-content/40">{p.id.slice(0, 8)}…</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

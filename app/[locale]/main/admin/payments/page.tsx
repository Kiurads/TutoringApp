import prisma from "@/prisma";
import PaymentsTable from "@/app/ui/main/payments/payments-table";

async function getPayments() {
	return prisma.payment.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			classId: true,
			amount: true,
			platformFeeAmount: true,
			teacherPayoutAmount: true,
			payoutStatus: true,
			payoutError: true,
			createdAt: true,
			student: { select: { firstName: true, lastName: true } },
			teacher: { select: { firstName: true, lastName: true } },
			class: { select: { subject: { select: { name: true } } } },
		},
	});
}

export default async function PaymentsPage() {
	const rawPayments = await getPayments();
	const grossVolume = rawPayments.reduce((s, p) => s + p.amount.toNumber(), 0);
	const platformRevenue = rawPayments.reduce((s, p) => s + (p.platformFeeAmount?.toNumber() ?? 0), 0);
	const teacherPayouts = rawPayments.reduce((s, p) => s + (p.teacherPayoutAmount?.toNumber() ?? p.amount.toNumber()), 0);

	// Prisma Decimal instances don't survive the server→client props boundary
	// (their methods are stripped during serialization) — convert to plain
	// numbers before handing off to the client PaymentsTable.
	const payments = rawPayments.map((p) => ({
		...p,
		amount: p.amount.toNumber(),
		platformFeeAmount: p.platformFeeAmount?.toNumber() ?? null,
		teacherPayoutAmount: p.teacherPayoutAmount?.toNumber() ?? null,
	}));

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

			<PaymentsTable initialPayments={payments} />
		</div>
	);
}

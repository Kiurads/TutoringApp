import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConnectStatus, startConnectOnboarding } from "@/app/lib/actions/payouts.actions";
import { fetchPaymentsByTeacherId } from "@/app/lib/actions/paymets.actions";
import ConnectOnboardingButton from "@/app/ui/main/payouts/connect-onboarding-button";

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

export default async function TeacherPayoutsPage({
	searchParams,
}: {
	searchParams: Promise<{ return?: string; refresh?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const [status, payments, { return: justReturned, refresh: needsRefresh }] = await Promise.all([
		getConnectStatus(),
		fetchPaymentsByTeacherId(session.user.email),
		searchParams,
	]);

	if ("error" in status) redirect("/main/teacher/dashboard");

	// Stripe sends the user here when their Account Link expired or the
	// hosted onboarding session ended without confirming completion — Stripe's
	// documented contract for refresh_url is to silently mint a fresh link and
	// send them right back in, not make them click "Continue onboarding" again.
	if (needsRefresh === "true" && status.connectStatus !== "active") {
		const result = await startConnectOnboarding();
		if (result.url) redirect(result.url);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Payouts</h1>
				<p className="text-base-content/60 text-sm mt-1">
					Your share of each class is paid out automatically via Stripe.
				</p>
			</div>

			{justReturned && status.connectStatus !== "active" && (
				<div role="alert" className="alert shadow-sm">
					<i className="fa-solid fa-circle-info text-info" />
					<span>
						We&apos;re still checking your account status with Stripe — this can take a
						moment. Refresh this page shortly if it doesn&apos;t update on its own.
					</span>
				</div>
			)}

			{status.connectStatus === "active" ? (
				<div role="alert" className="alert alert-success shadow-sm">
					<i className="fa-solid fa-circle-check" />
					<span>Payouts are active — you&apos;re all set to receive money automatically.</span>
				</div>
			) : (
				<div className="card bg-base-200 shadow-lg">
					<div className="card-body gap-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
								<i className="fa-solid fa-money-bill-transfer text-primary" />
							</div>
							<div>
								<h2 className="font-semibold">
									{status.hasAccount ? "Finish setting up payouts" : "Set up payouts"}
								</h2>
								<p className="text-sm text-base-content/60">
									{status.connectStatus === "restricted"
										? "Stripe needs a bit more information before payouts can resume."
										: "You'll be redirected to Stripe to verify your identity and add a bank account."}
								</p>
							</div>
						</div>
						<ConnectOnboardingButton
							label={status.hasAccount ? "Continue onboarding" : "Set up payouts"}
						/>
					</div>
				</div>
			)}

			<div className="rounded-lg border border-base-300 bg-base-100">
				<div className="px-4 py-3 border-b border-base-300">
					<h2 className="text-lg font-semibold">Payout History</h2>
				</div>

				{payments.length === 0 ? (
					<div className="text-center py-16">
						<div className="text-6xl mb-4 text-base-content/20">
							<i className="fa-solid fa-hand-holding-dollar"></i>
						</div>
						<p className="text-lg text-base-content/60">No payouts yet</p>
						<p className="text-sm text-base-content/40 mt-1">
							Payouts appear here once a class you&apos;ve taught is marked complete.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full divide-y divide-base-300 text-sm">
							<thead>
								<tr className="bg-base-200">
									<th className="px-4 py-3 font-medium text-base-content text-left">Student</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Payout</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Status</th>
									<th className="px-4 py-3 font-medium text-base-content text-left">Date</th>
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
											})}
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

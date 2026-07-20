import { fetchRefundRequestsForAdmin } from "@/app/lib/actions/refund-requests.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RefundRequestActions from "@/app/ui/main/refund-requests/refund-request-actions";

const STATUS_BADGE: Record<string, string> = {
	pending:      "badge-warning",
	accepted:     "badge-success",
	refused:      "badge-error",
	expired:      "badge-success",
	admin_review: "badge-error",
	resolved:     "badge-neutral",
};

const STATUS_LABEL: Record<string, string> = {
	pending:      "Pending",
	accepted:     "Accepted",
	refused:      "Refused",
	expired:      "Auto-refunded",
	admin_review: "Needs Review",
	resolved:     "Resolved",
};

export default async function AdminRefundRequestsPage({
	searchParams,
}: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { toast } = await searchParams;
	const requests = await fetchRefundRequestsForAdmin();

	const needsReview = requests.filter((r) => r.status === "admin_review");
	const others = requests.filter((r) => r.status !== "admin_review");

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">Refund Requests</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{requests.length} total · {needsReview.length} awaiting admin review
				</p>
			</div>

			{toast === "resolved" && (
				<div role="alert" className="alert alert-success animate-fade-in">
					<i className="fa-solid fa-circle-check"></i>
					<span>Dispute resolved successfully.</span>
				</div>
			)}

			{/* Escalated requests requiring action */}
			{needsReview.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-sm font-semibold text-error flex items-center gap-2">
						<i className="fa-solid fa-shield-halved"></i> Awaiting Admin Review
					</h2>
					{needsReview.map((r) => (
						<div key={r.id} className="card bg-base-200 shadow-lg border border-error/30">
							<div className="card-body gap-4">
								<div className="flex items-start justify-between gap-4 flex-wrap">
									<div>
										<p className="font-semibold">{r.student.name} → {r.teacher.name}</p>
										<p className="text-sm text-base-content/60">
											{r.class.subject} · {new Date(r.class.startTime).toLocaleDateString("en-GB", {
												day: "numeric", month: "short", year: "numeric",
											})} · €{parseFloat(r.class.totalPrice).toFixed(2)}
										</p>
									</div>
									<span className="badge badge-error badge-sm">Needs Review</span>
								</div>
								<div className="bg-base-100 rounded-lg p-3">
									<p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Student&apos;s Report</p>
									<p className="text-sm leading-relaxed whitespace-pre-wrap">{r.reason}</p>
								</div>
								<RefundRequestActions requestId={r.id} role="admin" />
							</div>
						</div>
					))}
				</div>
			)}

			{/* All other requests as a table */}
			{others.length > 0 && (
				<div className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold text-base-content/60">All Other Requests</h2>
					<div className="card bg-base-200 shadow-lg overflow-x-auto">
						<table className="table table-zebra text-sm">
							<thead>
								<tr>
									<th>Student</th>
									<th>Teacher</th>
									<th>Subject</th>
									<th>Date</th>
									<th>Amount</th>
									<th>Status</th>
									<th>Submitted</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{others.map((r) => (
									<tr key={r.id}>
										<td>{r.student.name}</td>
										<td>{r.teacher.name}</td>
										<td>{r.class.subject}</td>
										<td>
											{new Date(r.class.startTime).toLocaleDateString("en-GB", {
												day: "numeric", month: "short", year: "numeric",
											})}
										</td>
										<td>€{parseFloat(r.class.totalPrice).toFixed(2)}</td>
										<td>
											<span className={`badge ${STATUS_BADGE[r.status] ?? "badge-neutral"} badge-sm`}>
												{STATUS_LABEL[r.status] ?? r.status}
											</span>
										</td>
										<td className="text-base-content/60">
											{new Date(r.createdAt).toLocaleDateString("en-GB", {
												day: "numeric", month: "short",
											})}
										</td>
										<td>
											<Link
												href={`/main/teacher/refund-requests/${r.id}`}
												className="btn btn-ghost btn-xs gap-1"
											>
												<i className="fa-solid fa-eye"></i>
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{requests.length === 0 && (
				<div className="card bg-base-200 shadow-sm">
					<div className="card-body items-center text-center py-16 gap-3 text-base-content/40">
						<i className="fa-solid fa-inbox text-4xl"></i>
						<p className="text-sm">No refund requests yet.</p>
					</div>
				</div>
			)}
		</div>
	);
}

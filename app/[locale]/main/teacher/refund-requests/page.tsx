import { fetchRefundRequestsForTeacher } from "@/app/lib/actions/refund-requests.actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const STATUS_BADGE: Record<string, string> = {
	pending:      "badge-warning",
	accepted:     "badge-success",
	refused:      "badge-error",
	expired:      "badge-success",
	admin_review: "badge-info",
	resolved:     "badge-neutral",
};

const STATUS_LABEL: Record<string, string> = {
	pending:      "Pending",
	accepted:     "Accepted",
	refused:      "Refused",
	expired:      "Auto-refunded",
	admin_review: "Admin Review",
	resolved:     "Resolved",
};

export default async function TeacherRefundRequestsPage({
	searchParams,
}: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { toast } = await searchParams;
	const requests = await fetchRefundRequestsForTeacher();

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">Refund Requests</h1>
				<p className="text-base-content/60 text-sm mt-1">
					No-show reports submitted by your students.
				</p>
			</div>

			{toast === "accepted" && (
				<div role="alert" className="alert alert-success animate-fade-in">
					<i className="fa-solid fa-circle-check"></i>
					<span>Refund accepted and issued to the student.</span>
				</div>
			)}
			{toast === "refused" && (
				<div role="alert" className="alert alert-info animate-fade-in">
					<i className="fa-solid fa-circle-info"></i>
					<span>Refund request refused. The student may escalate to admin.</span>
				</div>
			)}

			{requests.length === 0 ? (
				<div className="card bg-base-200 shadow-sm">
					<div className="card-body items-center text-center py-16 gap-3 text-base-content/40">
						<i className="fa-solid fa-inbox text-4xl"></i>
						<p className="text-sm">No refund requests yet.</p>
					</div>
				</div>
			) : (
				<div className="card bg-base-200 shadow-lg overflow-x-auto">
					<table className="table table-zebra">
						<thead>
							<tr>
								<th>Student</th>
								<th>Subject</th>
								<th>Session Date</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Submitted</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{requests.map((r) => (
								<tr key={r.id}>
									<td className="font-medium">{r.student.name}</td>
									<td>{r.class.subject}</td>
									<td className="text-sm">
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
									<td className="text-sm text-base-content/60">
										{new Date(r.createdAt).toLocaleDateString("en-GB", {
											day: "numeric", month: "short",
										})}
									</td>
									<td>
										<Link
											href={`/main/teacher/refund-requests/${r.id}`}
											className="btn btn-ghost btn-xs gap-1"
										>
											<i className="fa-solid fa-eye"></i> Review
										</Link>
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

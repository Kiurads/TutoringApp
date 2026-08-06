import { fetchRefundRequestByIdForTeacher } from "@/app/lib/actions/refund-requests.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RefundRequestActions from "@/app/ui/main/refund-requests/refund-request-actions";

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
	admin_review: "Under Admin Review",
	resolved:     "Resolved by Admin",
};

export default async function TeacherRefundRequestDetailPage(props: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { id } = await props.params;
	const req = await fetchRefundRequestByIdForTeacher(id);

	if (!req) {
		return (
			<div className="flex flex-col gap-6">
				<Link href="/main/teacher/refund-requests" className="btn btn-ghost btn-sm w-fit gap-2">
					<i className="fa-solid fa-arrow-left"></i> Back
				</Link>
				<div className="text-center text-error py-16">Request not found.</div>
			</div>
		);
	}

	const isPending = req.status === "pending";
	const expiresAt = new Date(req.expiresAt);
	const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000));

	return (
		<div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
			<Link href="/main/teacher/refund-requests" className="btn btn-ghost btn-sm w-fit gap-2">
				<i className="fa-solid fa-arrow-left"></i> Back to Requests
			</Link>

			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div>
					<h1 className="text-2xl font-bold">No-Show Report</h1>
					<p className="text-base-content/60 text-sm mt-1">
						Submitted by {req.student.name} on{" "}
						{new Date(req.createdAt).toLocaleDateString("en-GB", {
							day: "numeric", month: "long", year: "numeric",
						})}
					</p>
				</div>
				<span className={`badge ${STATUS_BADGE[req.status] ?? "badge-neutral"} badge-md`}>
					{STATUS_LABEL[req.status] ?? req.status}
				</span>
			</div>

			{/* Class details */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body gap-3">
					<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Session Details
					</h2>
					<div className="grid grid-cols-2 gap-y-2 text-sm">
						<span className="text-base-content/60">Subject</span>
						<span className="font-medium">{req.class.subject}</span>
						<span className="text-base-content/60">Date</span>
						<span className="font-medium">
							{new Date(req.class.startTime).toLocaleDateString("en-GB", {
								weekday: "long", day: "numeric", month: "long", year: "numeric",
							})}
						</span>
						<span className="text-base-content/60">Amount paid</span>
						<span className="font-medium">€{parseFloat(req.class.totalPrice).toFixed(2)}</span>
					</div>
				</div>
			</div>

			{/* Student's reason */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body gap-3">
					<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Student&apos;s Report
					</h2>
					<p className="text-sm leading-relaxed whitespace-pre-wrap">{req.reason}</p>
				</div>
			</div>

			{/* Expiry notice */}
			{isPending && (
				<div role="alert" className="alert alert-warning">
					<i className="fa-solid fa-clock"></i>
					<span className="text-sm">
						You have <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> to respond.
						If you don&apos;t, the refund will be issued automatically.
					</span>
				</div>
			)}

			{/* Admin note */}
			{req.adminNote && (
				<div role="alert" className="alert alert-info">
					<i className="fa-solid fa-shield-halved"></i>
					<div>
						<p className="font-semibold text-sm">Admin note</p>
						<p className="text-sm">{req.adminNote}</p>
					</div>
				</div>
			)}

			{/* Actions */}
			{isPending && <RefundRequestActions requestId={req.id} role="teacher" />}
		</div>
	);
}

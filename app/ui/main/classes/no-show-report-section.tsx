"use client";

import { useState, useTransition } from "react";
import { createRefundRequest, escalateToAdmin } from "@/app/lib/actions/refund-requests.actions";
import type { RefundRequestData } from "@/app/lib/actions/refund-requests.actions";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
	pending:      { label: "Awaiting teacher response", color: "alert-warning",  icon: "fa-clock"           },
	accepted:     { label: "Refund approved",            color: "alert-success",  icon: "fa-circle-check"    },
	refused:      { label: "Refund refused by teacher",  color: "alert-error",    icon: "fa-circle-xmark"    },
	expired:      { label: "Auto-refunded (expired)",    color: "alert-success",  icon: "fa-circle-check"    },
	admin_review: { label: "Under admin review",         color: "alert-info",     icon: "fa-shield-halved"   },
	resolved:     { label: "Resolved by admin",          color: "alert-info",     icon: "fa-shield-halved"   },
};

export default function NoShowReportSection({
	classId,
	refundRequest,
}: {
	classId: string;
	refundRequest: RefundRequestData | null;
}) {
	const [reason, setReason] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isPending, startTransition] = useTransition();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		startTransition(async () => {
			const result = await createRefundRequest(classId, reason);
			if (result.error) {
				setError(result.error);
			} else {
				setSuccess(true);
			}
		});
	}

	function handleEscalate() {
		if (!refundRequest) return;
		setError(null);
		startTransition(async () => {
			const result = await escalateToAdmin(refundRequest.id);
			if (result.error) setError(result.error);
		});
	}

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-4">
				<div className="flex items-center gap-2">
					<i className="fa-solid fa-triangle-exclamation text-warning"></i>
					<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						No-Show Report
					</h3>
				</div>

				{/* Existing request status */}
				{refundRequest && (() => {
					const cfg = STATUS_CONFIG[refundRequest.status] ?? STATUS_CONFIG.pending;
					return (
						<div className={`alert ${cfg.color} animate-fade-in`}>
							<i className={`fa-solid ${cfg.icon}`}></i>
							<div className="flex flex-col gap-0.5">
								<span className="font-semibold text-sm">{cfg.label}</span>
								<span className="text-xs opacity-80">Submitted {new Date(refundRequest.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
								{refundRequest.adminNote && (
									<span className="text-xs mt-1 opacity-90">Admin note: {refundRequest.adminNote}</span>
								)}
							</div>
						</div>
					);
				})()}

				{/* Escalate button after refusal */}
				{refundRequest?.status === "refused" && (
					<div className="flex flex-col gap-2">
						<p className="text-sm text-base-content/70">
							If you believe this decision is incorrect, you can escalate to an administrator for review.
						</p>
						<button
							className="btn btn-outline btn-warning btn-sm self-start gap-2"
							onClick={handleEscalate}
							disabled={isPending}
						>
							{isPending
								? <span className="loading loading-spinner loading-xs" />
								: <><i className="fa-solid fa-shield-halved" /> Escalate to Admin</>
							}
						</button>
					</div>
				)}

				{/* Submit form — only when no request exists yet */}
				{!refundRequest && !success && (
					<form onSubmit={handleSubmit} className="flex flex-col gap-3">
						<p className="text-sm text-base-content/70">
							Did the teacher not show up for this session? Submit a no-show report and the teacher will have 5 days to respond. If they accept or don&apos;t respond, you&apos;ll be refunded automatically.
						</p>
						<div className="flex flex-col gap-1">
							<label htmlFor="no-show-reason" className="text-sm font-medium">Reason</label>
							<textarea
								id="no-show-reason"
								className="textarea textarea-bordered w-full h-24 resize-none"
								placeholder="Describe what happened…"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								maxLength={1000}
								required
							/>
						</div>
						{error && (
							<div role="alert" className="alert alert-error text-sm py-2">
								<i className="fa-solid fa-circle-xmark"></i>
								<span>{error}</span>
							</div>
						)}
						<button
							type="submit"
							className="btn btn-warning btn-sm self-start gap-2"
							disabled={isPending || !reason.trim()}
						>
							{isPending
								? <span className="loading loading-spinner loading-xs" />
								: <><i className="fa-solid fa-flag" /> Submit No-Show Report</>
							}
						</button>
					</form>
				)}

				{success && (
					<div role="alert" className="alert alert-success animate-fade-in">
						<i className="fa-solid fa-circle-check"></i>
						<span>Your report has been submitted. The teacher will be notified.</span>
					</div>
				)}

				{error && refundRequest && (
					<div role="alert" className="alert alert-error text-sm py-2">
						<i className="fa-solid fa-circle-xmark"></i>
						<span>{error}</span>
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { useState, useTransition } from "react";
import { acceptRefundRequest, refuseRefundRequest, adminResolveRefundRequest } from "@/app/lib/actions/refund-requests.actions";

export default function RefundRequestActions({
	requestId,
	role,
}: {
	requestId: string;
	role: "teacher" | "admin";
}) {
	const [adminNote, setAdminNote] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [confirmAction, setConfirmAction] = useState<"accept" | "refuse" | "refund" | "dismiss" | null>(null);

	function run(action: typeof confirmAction) {
		if (!action) return;
		setError(null);
		startTransition(async () => {
			let result: { error?: string } | undefined;
			if (role === "teacher") {
				result = action === "accept"
					? await acceptRefundRequest(requestId)
					: await refuseRefundRequest(requestId);
			} else {
				result = await adminResolveRefundRequest(
					requestId,
					action === "refund" ? "refund" : "dismiss",
					adminNote,
				);
			}
			if (result?.error) {
				setError(result.error);
				setConfirmAction(null);
			}
		});
	}

	if (role === "teacher") {
		return (
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body gap-4">
					<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Your Response
					</h2>
					<p className="text-sm text-base-content/70">
						Did you attend this session? If you did not attend, accept the refund. If you did attend, refuse it — the student may then escalate to an administrator.
					</p>

					{error && (
						<div role="alert" className="alert alert-error text-sm py-2">
							<i className="fa-solid fa-circle-xmark"></i>
							<span>{error}</span>
						</div>
					)}

					{confirmAction ? (
						<div className="flex flex-col gap-3">
							<p className="text-sm font-medium">
								{confirmAction === "accept"
									? "Confirm: accept this refund request and issue a refund to the student?"
									: "Confirm: refuse this refund request?"}
							</p>
							<div className="flex gap-2">
								<button
									className={`btn btn-sm ${confirmAction === "accept" ? "btn-success" : "btn-error"}`}
									onClick={() => run(confirmAction)}
									disabled={isPending}
								>
									{isPending
										? <span className="loading loading-spinner loading-xs" />
										: "Yes, confirm"}
								</button>
								<button
									className="btn btn-ghost btn-sm"
									onClick={() => setConfirmAction(null)}
									disabled={isPending}
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="flex gap-3 flex-wrap">
							<button
								className="btn btn-success btn-sm gap-2"
								onClick={() => setConfirmAction("accept")}
							>
								<i className="fa-solid fa-circle-check"></i> Accept &amp; Refund
							</button>
							<button
								className="btn btn-error btn-outline btn-sm gap-2"
								onClick={() => setConfirmAction("refuse")}
							>
								<i className="fa-solid fa-circle-xmark"></i> Refuse
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Admin view
	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-4">
				<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
					Admin Resolution
				</h2>
				<div className="flex flex-col gap-1">
					<label htmlFor="refund-admin-note" className="text-sm font-medium">Admin note (optional)</label>
					<textarea
						id="refund-admin-note"
						className="textarea textarea-bordered w-full h-20 resize-none text-sm"
						placeholder="Add a note visible to both parties…"
						value={adminNote}
						onChange={(e) => setAdminNote(e.target.value)}
						maxLength={500}
					/>
				</div>

				{error && (
					<div role="alert" className="alert alert-error text-sm py-2">
						<i className="fa-solid fa-circle-xmark"></i>
						<span>{error}</span>
					</div>
				)}

				{confirmAction ? (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium">
							{confirmAction === "refund"
								? "Confirm: issue a full refund to the student?"
								: "Confirm: dismiss this dispute (no refund)?"}
						</p>
						<div className="flex gap-2">
							<button
								className={`btn btn-sm ${confirmAction === "refund" ? "btn-success" : "btn-neutral"}`}
								onClick={() => run(confirmAction)}
								disabled={isPending}
							>
								{isPending
									? <span className="loading loading-spinner loading-xs" />
									: "Yes, confirm"}
							</button>
							<button
								className="btn btn-ghost btn-sm"
								onClick={() => setConfirmAction(null)}
								disabled={isPending}
							>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="flex gap-3 flex-wrap">
						<button
							className="btn btn-success btn-sm gap-2"
							onClick={() => setConfirmAction("refund")}
						>
							<i className="fa-solid fa-rotate-left"></i> Force Refund
						</button>
						<button
							className="btn btn-neutral btn-outline btn-sm gap-2"
							onClick={() => setConfirmAction("dismiss")}
						>
							<i className="fa-solid fa-xmark"></i> Dismiss
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

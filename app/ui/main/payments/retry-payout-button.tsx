"use client";

import { useState, useTransition } from "react";
import { retryFailedPayout } from "@/app/lib/actions/payouts.actions";

export default function RetryPayoutButton({ paymentId }: { paymentId: string }) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	if (done) {
		return <span className="text-xs text-success">Retry queued</span>;
	}

	return (
		<div className="flex flex-col gap-1">
			<button
				type="button"
				className="btn btn-ghost btn-xs gap-1"
				disabled={isPending}
				onClick={() =>
					startTransition(async () => {
						setError(null);
						const result = await retryFailedPayout(paymentId);
						if (result.error) setError(result.error);
						else setDone(true);
					})
				}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-xs" />
				) : (
					<i className="fa-solid fa-arrows-rotate"></i>
				)}
				Retry
			</button>
			{error && <span className="text-xs text-error">{error}</span>}
		</div>
	);
}

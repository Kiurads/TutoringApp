"use client";

import { useState, useTransition } from "react";
import { startConnectOnboarding } from "@/app/lib/actions/payouts.actions";

export default function ConnectOnboardingButton({ label }: { label: string }) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleClick() {
		setError(null);
		startTransition(async () => {
			const result = await startConnectOnboarding();
			if (result.error) {
				setError(result.error);
			} else if (result.url) {
				// Stripe-hosted, external URL — a plain navigation, not router.push.
				window.location.href = result.url;
			}
		});
	}

	return (
		<div className="flex flex-col gap-2">
			<button className="btn btn-primary" onClick={handleClick} disabled={isPending}>
				{isPending ? (
					<span className="loading loading-spinner loading-sm"></span>
				) : (
					<>
						<i className="fa-solid fa-arrow-up-right-from-square" /> {label}
					</>
				)}
			</button>
			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-triangle-exclamation" />
					<span>{error}</span>
				</div>
			)}
		</div>
	);
}

"use client";

import { useState, useTransition } from "react";
import { purchaseStoreItem } from "@/app/lib/actions/store.actions";
import type { StoreItemKey } from "@/app/lib/store-catalog";

interface Props {
	itemKey: StoreItemKey;
	cost: number;
	currentGems: number;
	alreadyOwned: boolean;
	label: string; // "Buy" | "Owned" | "Active"
}

export default function PurchaseButton({
	itemKey,
	cost,
	currentGems,
	alreadyOwned,
	label,
}: Props) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const canAfford = currentGems >= cost;

	if (alreadyOwned) {
		return (
			<span className="badge badge-success gap-1 text-xs">
				<i className="fa-solid fa-check"></i> {label}
			</span>
		);
	}

	function handleBuy() {
		setError(null);
		setSuccess(false);
		startTransition(async () => {
			const result = await purchaseStoreItem(itemKey);
			if (result.error) {
				setError(result.error);
			} else {
				setSuccess(true);
			}
		});
	}

	return (
		<div className="flex flex-col gap-1 items-end">
			<button
				className="btn btn-sm btn-primary gap-1"
				onClick={handleBuy}
				disabled={isPending || !canAfford}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-xs" />
				) : (
					<>
						<i className="fa-solid fa-gem text-xs"></i>
						{cost.toLocaleString()}
					</>
				)}
			</button>
			{!canAfford && !error && (
				<span className="text-[10px] text-base-content/40">
					Need {(cost - currentGems).toLocaleString()} more
				</span>
			)}
			{error && (
				<span className="text-[10px] text-error">{error}</span>
			)}
			{success && (
				<span className="text-[10px] text-success">Purchased!</span>
			)}
		</div>
	);
}

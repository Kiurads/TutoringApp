"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

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
		startTransition(async () => {
			const result = await purchaseStoreItem(itemKey);
			if (result.error) {
				setError(result.error);
			} else {
				// purchaseStoreItem already revalidates this path server-side, so
				// navigating back to it (with a toast marker) picks up the fresh
				// gem balance / ownership state along with the confirmation —
				// matching how the class/refund flows already confirm actions.
				router.push("/main/student/store?toast=purchased");
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
		</div>
	);
}

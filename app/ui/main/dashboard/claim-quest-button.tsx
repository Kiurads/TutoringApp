"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimWeeklyQuest } from "@/app/lib/quests";

interface Props {
	questKey: string;
	completed: boolean;
	claimed: boolean;
	reward: number;
}

export default function ClaimQuestButton({ questKey, completed, claimed, reward }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [justClaimed, setJustClaimed] = useState(false);

	if (claimed || justClaimed) {
		return (
			<span className="badge badge-success badge-sm gap-1 shrink-0">
				<i className="fa-solid fa-check text-[10px]"></i> Claimed
			</span>
		);
	}

	if (!completed) {
		return (
			<span className="text-xs text-base-content/40 shrink-0">+{reward}</span>
		);
	}

	function handleClaim() {
		setError(null);
		startTransition(async () => {
			const result = await claimWeeklyQuest(questKey);
			if (result.error) {
				setError(result.error);
			} else {
				setJustClaimed(true);
				router.refresh();
			}
		});
	}

	return (
		<div className="flex flex-col items-end gap-0.5 shrink-0">
			<button
				className="btn btn-secondary btn-xs gap-1"
				onClick={handleClaim}
				disabled={isPending}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-xs"></span>
				) : (
					<>Claim +{reward}</>
				)}
			</button>
			{error && <span className="text-[10px] text-error">{error}</span>}
		</div>
	);
}

"use client";

import { useState, useTransition } from "react";
import { setActiveFrame } from "@/app/lib/actions/store.actions";

interface Props {
	frameKey: string | null; // null = "Remove frame"
	isActive: boolean;
}

export default function EquipFrameButton({ frameKey, isActive }: Props) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	if (isActive) {
		return (
			<div className="flex flex-col items-end gap-1">
				<span className="badge badge-success gap-1 text-xs">
					<i className="fa-solid fa-check"></i> Equipped
				</span>
				<button
					className="text-[10px] text-base-content/40 hover:text-error transition-colors"
					disabled={isPending}
					onClick={() => {
						setError(null);
						startTransition(async () => {
							const res = await setActiveFrame(null);
							if (res.error) setError(res.error);
						});
					}}
				>
					{isPending ? "Removing…" : "Remove"}
				</button>
				{error && <span className="text-[10px] text-error">{error}</span>}
			</div>
		);
	}

	return (
		<div className="flex flex-col items-end gap-1">
			<button
				className="btn btn-sm btn-outline btn-primary gap-1"
				disabled={isPending}
				onClick={() => {
					setError(null);
					startTransition(async () => {
						const res = await setActiveFrame(frameKey);
						if (res.error) setError(res.error);
					});
				}}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-xs" />
				) : (
					<>
						<i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
						Equip
					</>
				)}
			</button>
			{error && <span className="text-[10px] text-error">{error}</span>}
		</div>
	);
}

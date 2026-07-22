"use client";

import { useState, useTransition } from "react";
import { completeClass } from "@/app/lib/actions/classes.actions";
import { useRouter } from "next/navigation";

export default function CompleteClassButton({ classId }: { classId: string }) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	function handleComplete() {
		setError(null);
		startTransition(async () => {
			const result = await completeClass(classId);
			if (result?.error) {
				setError(result.error);
			} else {
				router.refresh();
			}
		});
	}

	return (
		<div className="flex flex-col gap-2 items-start">
			<button
				className="btn btn-success gap-2"
				disabled={isPending}
				onClick={handleComplete}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-sm" />
				) : (
					<i className="fa-solid fa-circle-check" />
				)}
				{isPending ? "Completing…" : "Mark as Complete"}
			</button>
			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-circle-xmark"></i>
					<span>{error}</span>
				</div>
			)}
		</div>
	);
}

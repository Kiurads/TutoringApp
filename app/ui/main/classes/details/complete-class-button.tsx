"use client";

import { useTransition } from "react";
import { completeClass } from "@/app/lib/actions/classes.actions";
import { useRouter } from "next/navigation";

export default function CompleteClassButton({ classId }: { classId: string }) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	function handleComplete() {
		startTransition(async () => {
			const result = await completeClass(classId);
			if (result?.error) {
				alert(result.error);
			} else {
				router.refresh();
			}
		});
	}

	return (
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
	);
}

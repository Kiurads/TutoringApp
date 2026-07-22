"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import deleteTeacherById from "@/app/lib/actions/teachers/delete-teacher";

export default function DeleteTeacherButton(props: { id: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleClick() {
		setError(null);
		startTransition(async () => {
			try {
				await deleteTeacherById(props.id);
				router.push("/main/admin/teachers");
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to delete teacher. Please try again."
				);
			}
		});
	}

	return (
		<div className="flex flex-col gap-2 flex-grow">
			<button
				className="btn btn-error w-full"
				onClick={handleClick}
				disabled={isPending}
			>
				{isPending ? <span className="loading loading-spinner loading-sm"></span> : "Confirm"}
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

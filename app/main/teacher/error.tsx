"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TeacherError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
			<i className="fa-solid fa-triangle-exclamation text-4xl text-warning"></i>
			<h2 className="text-xl font-bold">Something went wrong</h2>
			<p className="text-base-content/60 max-w-sm">
				This page hit an unexpected error. Your account and data are fine —
				try again, or head back to your dashboard.
			</p>
			<div className="flex gap-2">
				<button className="btn btn-primary" onClick={reset}>
					Try again
				</button>
				<Link href="/main/teacher/dashboard" className="btn btn-outline">
					Go to dashboard
				</Link>
			</div>
		</div>
	);
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
		<div className="flex flex-col items-center justify-center min-h-screen gap-4">
			<h2 className="text-2xl font-bold">Something went wrong</h2>
			<div className="flex gap-2">
				<button className="btn btn-primary" onClick={reset}>
					Try again
				</button>
				<Link href="/login" className="btn btn-outline">
					Go to login
				</Link>
			</div>
		</div>
	);
}

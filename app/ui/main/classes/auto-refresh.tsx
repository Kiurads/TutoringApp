"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
	const router = useRouter();
	const [secondsAgo, setSecondsAgo] = useState(0);
	const lastRefresh = useRef(Date.now());

	useEffect(() => {
		// Tick the "X seconds ago" counter every second
		const ticker = setInterval(() => {
			setSecondsAgo(Math.floor((Date.now() - lastRefresh.current) / 1000));
		}, 1000);

		// Refresh the server component data on the interval
		const refresher = setInterval(() => {
			router.refresh();
			lastRefresh.current = Date.now();
			setSecondsAgo(0);
		}, intervalMs);

		return () => {
			clearInterval(ticker);
			clearInterval(refresher);
		};
	}, [router, intervalMs]);

	return (
		<span className="flex items-center gap-1.5 text-xs text-base-content/40">
			<span className="relative flex h-2 w-2">
				<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
				<span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
			</span>
			{secondsAgo < 5 ? "Updated just now" : `Updated ${secondsAgo}s ago`}
		</span>
	);
}

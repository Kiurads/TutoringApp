"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const JitsiEmbed = dynamic(() => import("./jitsi-embed"), { ssr: false });

const JOIN_WINDOW_BEFORE_MS = 10 * 60 * 1000; // 10 minutes before start
const JOIN_WINDOW_GRACE_MS = 5 * 60 * 1000; // 5 minutes after the scheduled end
const RECHECK_INTERVAL_MS = 30 * 1000;

export default function JoinClassCard({
	jitsiRoom,
	startTime,
	durationInHours,
	status,
	displayName,
}: {
	jitsiRoom: string | null;
	startTime: string;
	durationInHours: string;
	status: string;
	displayName: string;
}) {
	const [joined, setJoined] = useState(false);
	const [inWindow, setInWindow] = useState(false);

	useEffect(() => {
		const start = new Date(startTime).getTime();
		const end = start + Number(durationInHours) * 3_600_000;

		const check = () => {
			const now = Date.now();
			setInWindow(
				now >= start - JOIN_WINDOW_BEFORE_MS && now <= end + JOIN_WINDOW_GRACE_MS,
			);
		};

		check();
		const interval = setInterval(check, RECHECK_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [startTime, durationInHours]);

	if (!jitsiRoom || status !== "scheduled") return null;

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-4">
				<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
					Video Call
				</h3>

				{joined ? (
					<JitsiEmbed room={jitsiRoom} displayName={displayName} />
				) : inWindow ? (
					<button
						type="button"
						className="btn btn-primary w-fit gap-2"
						onClick={() => setJoined(true)}
					>
						<i className="fa-solid fa-video"></i> Join Class
					</button>
				) : (
					<p className="text-sm text-base-content/60">
						The video call opens 10 minutes before the scheduled start time.
					</p>
				)}
			</div>
		</div>
	);
}

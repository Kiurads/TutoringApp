"use client";

import { useEffect, useRef } from "react";

declare global {
	interface Window {
		JitsiMeetExternalAPI?: new (
			domain: string,
			options: Record<string, unknown>,
		) => {
			dispose: () => void;
		};
	}
}

const JITSI_DOMAIN = "meet.jit.si";
const SCRIPT_SRC = `https://${JITSI_DOMAIN}/external_api.js`;

function loadJitsiScript(): Promise<void> {
	if (window.JitsiMeetExternalAPI) return Promise.resolve();

	const existing = document.querySelector<HTMLScriptElement>(
		`script[src="${SCRIPT_SRC}"]`,
	);
	if (existing) {
		return new Promise((resolve, reject) => {
			existing.addEventListener("load", () => resolve());
			existing.addEventListener("error", () =>
				reject(new Error("Failed to load Jitsi Meet script.")),
			);
		});
	}

	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Jitsi Meet script."));
		document.body.appendChild(script);
	});
}

export default function JitsiEmbed({
	room,
	displayName,
}: {
	room: string;
	displayName: string;
}) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let api: { dispose: () => void } | null = null;
		let cancelled = false;

		loadJitsiScript()
			.then(() => {
				if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) {
					return;
				}
				api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
					roomName: room,
					parentNode: containerRef.current,
					userInfo: { displayName },
					width: "100%",
					height: "100%",
					configOverwrite: {
						prejoinPageEnabled: true,
					},
				});
			})
			.catch((err) => {
				console.error(err);
			});

		return () => {
			cancelled = true;
			api?.dispose();
		};
	}, [room, displayName]);

	return (
		<div
			ref={containerRef}
			className="w-full aspect-video rounded-box overflow-hidden bg-base-300"
		/>
	);
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOASTS: Record<string, { message: string; alertClass: string; icon: string }> = {
	created: {
		message: "Class request sent. You'll be notified when a teacher accepts.",
		alertClass: "alert-success",
		icon: "fa-circle-check",
	},
	accepted: {
		message: "Class accepted successfully.",
		alertClass: "alert-success",
		icon: "fa-circle-check",
	},
	refused: {
		message: "Class request refused.",
		alertClass: "alert-warning",
		icon: "fa-triangle-exclamation",
	},
	cancelled: {
		message: "Class cancelled successfully.",
		alertClass: "alert-info",
		icon: "fa-circle-info",
	},
	claimed: {
		message: "Class claimed! The student will be notified.",
		alertClass: "alert-success",
		icon: "fa-circle-check",
	},
	paid: {
		message: "Payment successful! Your class is confirmed.",
		alertClass: "alert-success",
		icon: "fa-sack-dollar",
	},
};

export default function ToastNotification({ toast }: { toast?: string }) {
	const router = useRouter();
	// Capture the initial value so it survives after the URL is cleaned
	const [initialToast] = useState(toast);
	const [visible, setVisible] = useState(Boolean(toast));
	const [fading, setFading] = useState(false);

	const dismiss = () => {
		setFading(true);
		setTimeout(() => setVisible(false), 500);
	};

	useEffect(() => {
		if (!initialToast) return;

		// Remove ?toast= from the URL so a page refresh doesn't re-show it.
		// This triggers a re-render with toast=undefined, but initialToast is
		// preserved in state so the alert stays visible.
		const url = new URL(window.location.href);
		url.searchParams.delete("toast");
		router.replace(url.pathname, { scroll: false });

		// Start fade-out after 4 seconds, remove from DOM 500ms later
		const fadeTimer = setTimeout(() => setFading(true), 4000);
		const removeTimer = setTimeout(() => setVisible(false), 4500);
		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(removeTimer);
		};
	}, [initialToast, router]);

	const config = initialToast ? TOASTS[initialToast] : null;
	if (!config || !visible) return null;

	return (
		<div
			className={`fixed bottom-6 left-6 z-50 w-full max-w-sm transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
		>
			<div
				role="alert"
				className={`alert ${config.alertClass} flex justify-between items-center shadow-lg`}
			>
				<div className="flex items-center gap-2">
					<i className={`fa-solid ${config.icon}`}></i>
					<span>{config.message}</span>
				</div>
				<button
					onClick={dismiss}
					className="btn btn-ghost btn-xs"
					aria-label="Dismiss"
				>
					<i className="fa-solid fa-xmark"></i>
				</button>
			</div>
		</div>
	);
}

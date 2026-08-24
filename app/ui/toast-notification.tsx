"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TOASTS: Record<string, { alertClass: string; icon: string }> = {
	created: { alertClass: "alert-success", icon: "fa-circle-check" },
	accepted: { alertClass: "alert-success", icon: "fa-circle-check" },
	refused: { alertClass: "alert-warning", icon: "fa-triangle-exclamation" },
	cancelled: { alertClass: "alert-info", icon: "fa-circle-info" },
	claimed: { alertClass: "alert-success", icon: "fa-circle-check" },
	paid: { alertClass: "alert-success", icon: "fa-sack-dollar" },
	purchased: { alertClass: "alert-success", icon: "fa-gem" },
	deleted: { alertClass: "alert-success", icon: "fa-circle-check" },
	resolved: { alertClass: "alert-success", icon: "fa-circle-check" },
};

export default function ToastNotification({ toast }: { toast?: string }) {
	const t = useTranslations("ToastNotification");
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
			// bottom-right rather than bottom-left: the mobile drawer-toggle
			// button is fixed bottom-4 left-4, and this toast used to sit right
			// on top of it on small viewports.
			className={`fixed bottom-6 right-6 z-50 w-full max-w-sm transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
		>
			<div
				role="alert"
				className={`alert ${config.alertClass} flex justify-between items-center shadow-lg`}
			>
				<div className="flex items-center gap-2">
					<i className={`fa-solid ${config.icon}`}></i>
					<span>{t(initialToast as string)}</span>
				</div>
				<button
					onClick={dismiss}
					className="btn btn-ghost btn-xs"
					aria-label={t("dismiss")}
				>
					<i className="fa-solid fa-xmark"></i>
				</button>
			</div>
		</div>
	);
}

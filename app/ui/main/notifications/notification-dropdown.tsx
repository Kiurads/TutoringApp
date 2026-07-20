"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	markNotificationRead,
	markAllNotificationsRead,
	type NotificationData,
} from "@/app/lib/actions/notifications.actions";

const TYPE_CONFIG: Record<string, { icon: string; bg: string; fg: string }> = {
	class_requested: { icon: "fa-bell",                bg: "bg-primary",  fg: "text-primary-content"  },
	class_accepted:  { icon: "fa-circle-check",        bg: "bg-success",  fg: "text-success-content"  },
	class_refused:   { icon: "fa-circle-xmark",        bg: "bg-error",    fg: "text-error-content"    },
	class_cancelled: { icon: "fa-ban",                 bg: "bg-neutral",  fg: "text-neutral-content"  },
	class_claimed:   { icon: "fa-chalkboard-user",     bg: "bg-success",  fg: "text-success-content"  },
	class_paid:      { icon: "fa-sack-dollar",         bg: "bg-success",  fg: "text-success-content"  },
	class_completed: { icon: "fa-flag-checkered",      bg: "bg-info",     fg: "text-info-content"     },
	refund_requested: { icon: "fa-rotate-left",     bg: "bg-warning",  fg: "text-warning-content"  },
	refund_decided:   { icon: "fa-rotate-left",     bg: "bg-info",     fg: "text-info-content"     },
	refund_escalated: { icon: "fa-shield-halved",   bg: "bg-error",    fg: "text-error-content"    },
	refund_resolved:  { icon: "fa-shield-halved",   bg: "bg-neutral",  fg: "text-neutral-content"  },
};

const FALLBACK = { icon: "fa-circle-info", bg: "bg-info", fg: "text-info-content" };

function timeAgo(iso: string): string {
	const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return "now";
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	if (s < 86400) return `${Math.floor(s / 3600)}h`;
	return `${Math.floor(s / 86400)}d`;
}

const MODAL_ID = "notifications_modal";

export default function NotificationDropdown({
	initialNotifications,
	userEmail,
}: {
	initialNotifications: NotificationData[];
	userEmail: string;
}) {
	const router = useRouter();
	const [notifications, setNotifications] = useState(initialNotifications);
	const [isPending, startTransition] = useTransition();
	const [loadingId, setLoadingId] = useState<string | null>(null);

	const unreadCount = notifications.filter((n) => !n.read).length;

	function openModal() {
		(document.getElementById(MODAL_ID) as HTMLDialogElement)?.showModal();
	}

	async function handleClick(n: NotificationData) {
		if (!n.read) {
			setNotifications((prev) =>
				prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
			);
			setLoadingId(n.id);
			await markNotificationRead(n.id);
			setLoadingId(null);
		}
		(document.getElementById(MODAL_ID) as HTMLDialogElement)?.close();
		if (n.link) router.push(n.link);
	}

	function handleMarkAll() {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		startTransition(async () => {
			await markAllNotificationsRead(userEmail);
		});
	}

	return (
		<>
			{/* Bell trigger */}
			<button
				onClick={openModal}
				className="relative btn btn-ghost btn-sm btn-square"
				aria-label="Notifications"
			>
				<i className="fa-solid fa-bell text-base"></i>
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 badge badge-error badge-xs min-w-[1.1rem] h-[1.1rem] text-[0.6rem] font-bold">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Modal */}
			<dialog id={MODAL_ID} className="modal">
				<div className="modal-box p-0 max-w-sm w-full">

					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-sm">Notifications</h3>
							{unreadCount > 0 && (
								<span className="badge badge-primary badge-xs">{unreadCount}</span>
							)}
						</div>
						<div className="flex items-center gap-1">
							{unreadCount > 0 && (
								<button
									onClick={handleMarkAll}
									disabled={isPending}
									className="btn btn-ghost btn-xs text-xs text-base-content/50"
								>
									Mark all read
								</button>
							)}
							<form method="dialog">
								<button className="btn btn-ghost btn-xs btn-square">
									<i className="fa-solid fa-xmark text-xs"></i>
								</button>
							</form>
						</div>
					</div>

					{/* List */}
					<div className="overflow-y-auto max-h-96">
						{notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 gap-2 text-base-content/30">
								<i className="fa-regular fa-bell text-3xl"></i>
								<p className="text-sm">No notifications</p>
							</div>
						) : (
							notifications.map((n) => {
								const cfg = TYPE_CONFIG[n.type] ?? FALLBACK;
								return (
									<button
										key={n.id}
										onClick={() => handleClick(n)}
										disabled={loadingId === n.id}
										className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-base-200 transition-all hover:bg-base-200 ${
											n.read ? "opacity-50" : ""
										}`}
									>
										{/* Icon bubble */}
										<span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs ${cfg.bg} ${cfg.fg}`}>
											{loadingId === n.id
												? <span className="loading loading-spinner loading-xs"></span>
												: <i className={`fa-solid ${cfg.icon}`}></i>
											}
										</span>

										{/* Message */}
										<span className={`flex-1 text-xs leading-snug min-w-0 truncate ${n.read ? "" : "font-medium"}`}>
											{n.body}
										</span>

										{/* Time */}
										<span className="text-xs text-base-content/40 shrink-0">
											{timeAgo(n.createdAt)}
										</span>
									</button>
								);
							})
						)}
					</div>
				</div>

				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</>
	);
}

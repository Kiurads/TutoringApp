"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleTeacherOnline } from "@/app/lib/actions/teachers.actions";
import NotificationDropdown from "@/app/ui/main/notifications/notification-dropdown";
import type { NotificationData } from "@/app/lib/actions/notifications.actions";

type NavItem = { href: string; icon: string; label: string; dataTour?: string };

const sections: { heading: string; items: NavItem[] }[] = [
	{
		heading: "Overview",
		items: [
			{ href: "/main/teacher/dashboard", icon: "fa-house-user",     label: "Dashboard", dataTour: "nav-dashboard" },
		],
	},
	{
		heading: "Teaching",
		items: [
			{ href: "/main/teacher/classes",         icon: "fa-school",         label: "Classes", dataTour: "nav-classes" },
			{ href: "/main/teacher/regular-classes", icon: "fa-rotate",         label: "Recurring Classes", dataTour: "nav-recurring-classes" },
			{ href: "/main/teacher/calendar",        icon: "fa-calendar-days",  label: "Calendar", dataTour: "nav-calendar" },
			{ href: "/main/teacher/availability",    icon: "fa-clock",          label: "Availability", dataTour: "nav-availability" },
		],
	},
	{
		heading: "People & Money",
		items: [
			{ href: "/main/teacher/students",        icon: "fa-user-graduate",  label: "Students", dataTour: "nav-students" },
			{ href: "/main/teacher/earnings",        icon: "fa-dollar-sign",    label: "Earnings", dataTour: "nav-earnings" },
			{ href: "/main/teacher/payouts",         icon: "fa-money-bill-transfer", label: "Payouts", dataTour: "nav-payouts" },
			{ href: "/main/teacher/refund-requests", icon: "fa-rotate-left",    label: "Refund Requests", dataTour: "nav-refund-requests" },
		],
	},
	{
		heading: "Account",
		items: [
			{ href: "/main/teacher/profile",    icon: "fa-circle-user",         label: "Profile", dataTour: "nav-profile" },
			{ href: "/main/teacher/onboarding", icon: "fa-wand-magic-sparkles", label: "Preferences", dataTour: "nav-preferences" },
		],
	},
];

export default function TeacherSidebar({
	userEmail,
	firstName,
	avatarDataUri,
	initialIsOnline,
	initialNotifications,
	children,
}: {
	userEmail: string;
	firstName: string;
	avatarDataUri: string;
	initialIsOnline: boolean;
	initialNotifications: NotificationData[];
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [isOnline, setIsOnline] = useState(initialIsOnline);
	const [isPending, startTransition] = useTransition();

	function handleToggle() {
		startTransition(async () => {
			const next = await toggleTeacherOnline(userEmail);
			setIsOnline(next);
		});
	}

	return (
		<div className="drawer lg:drawer-open flex-1">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content flex flex-col bg-base-100">
				<div className="w-full p-6">{children}</div>
				<label
					htmlFor="my-drawer-2"
					aria-label="Open menu"
					className="btn btn-primary drawer-button lg:hidden fixed bottom-4 left-4 shadow-lg"
				>
					<i className="fa-solid fa-bars"></i>
				</label>
			</div>

			<div className="drawer-side overflow-hidden lg:!top-16 lg:!h-[calc(100dvh-4rem)]">
				<label
					htmlFor="my-drawer-2"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>

				<aside className="bg-base-200 text-base-content h-full w-64 flex flex-col overflow-y-auto">
					{/* Header */}
					<div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
						<div className="flex items-center gap-2 text-xl font-bold">
							<i className="fa-solid fa-graduation-cap text-primary"></i>
							<span>Teacher Panel</span>
						</div>
						<NotificationDropdown
							initialNotifications={initialNotifications}
							userEmail={userEmail}
						/>
					</div>

					{/* Online toggle */}
					<div className="px-3 pb-3 shrink-0">
						<button
							data-tour="online-toggle"
							onClick={handleToggle}
							disabled={isPending}
							className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 font-semibold transition-colors text-sm ${
								isOnline
									? "bg-success text-success-content hover:bg-success/80"
									: "bg-base-300 text-base-content hover:bg-base-300/80"
							}`}
						>
							<span
								className={`w-2.5 h-2.5 rounded-full shrink-0 ${
									isOnline ? "bg-success-content animate-pulse" : "bg-base-content/40"
								}`}
							/>
							{isPending ? "Updating…" : isOnline ? "Online" : "Offline"}
						</button>
					</div>

					{/* Divider before nav */}
					<div className="border-t border-base-300 mx-3 mb-2" />

					{/* Nav sections */}
					<nav className="flex-1 px-3 pb-4 flex flex-col gap-4 overflow-y-auto">
						{sections.map((section, si) => (
							<div key={section.heading}>
								{/* Section label */}
								<p className="text-[10px] font-bold uppercase tracking-widest text-base-content/35 px-2 mb-1">
									{section.heading}
								</p>

								{/* Section items */}
								<ul className="flex flex-col gap-0.5">
									{section.items.map((link) => {
										const isActive = pathname.startsWith(link.href);
										return (
											<li key={link.href}>
												<Link
													href={link.href}
													data-tour={link.dataTour}
													className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
														isActive
															? "bg-primary text-primary-content"
															: "hover:bg-base-300"
													}`}
												>
													<i className={`fa-solid ${link.icon} w-4 text-center`}></i>
													<span>{link.label}</span>
												</Link>
											</li>
										);
									})}
								</ul>

								{/* Divider between sections (not after last) */}
								{si < sections.length - 1 && (
									<div className="border-t border-base-300 mt-3" />
								)}
							</div>
						))}
					</nav>

					{/* Avatar footer */}
					<div className="shrink-0 border-t border-base-300 px-3 py-3">
						<Link
							href="/main/teacher/profile"
							className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={avatarDataUri}
								alt=""
								width={36}
								height={36}
								className="size-9 rounded-full object-cover shrink-0"
							/>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold truncate">{firstName}</p>
								<p className="text-xs text-base-content/50 truncate">{userEmail}</p>
							</div>
						</Link>
					</div>
				</aside>
			</div>
		</div>
	);
}

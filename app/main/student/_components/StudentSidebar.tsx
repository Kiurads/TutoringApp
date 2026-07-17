"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationDropdown from "@/app/ui/main/notifications/notification-dropdown";
import type { NotificationData } from "@/app/lib/actions/notifications.actions";

type NavItem = { href: string; icon: string; label: string };

const sections: { heading: string; items: NavItem[] }[] = [
	{
		heading: "Overview",
		items: [
			{ href: "/main/student/dashboard", icon: "fa-house-user", label: "Dashboard" },
		],
	},
	{
		heading: "Learning",
		items: [
			{ href: "/main/student/classes",         icon: "fa-school",          label: "Classes"  },
			{ href: "/main/student/regular-classes", icon: "fa-rotate",          label: "Recurring Classes" },
			{ href: "/main/student/calendar",        icon: "fa-calendar-days",   label: "Calendar" },
			{ href: "/main/student/teachers",        icon: "fa-chalkboard-user", label: "Teachers" },
		],
	},
	{
		heading: "Rewards",
		items: [
			{ href: "/main/student/store", icon: "fa-gem", label: "Gem Store" },
		],
	},
	{
		heading: "Account",
		items: [
			{ href: "/main/student/profile",    icon: "fa-circle-user",           label: "Profile"    },
			{ href: "/main/student/onboarding", icon: "fa-wand-magic-sparkles",   label: "Preferences" },
		],
	},
];

export default function StudentSidebar({
	userEmail,
	firstName,
	avatarDataUri,
	initialNotifications,
	children,
}: {
	userEmail: string;
	firstName: string;
	avatarDataUri: string;
	initialNotifications: NotificationData[];
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="drawer lg:drawer-open flex-1">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content flex flex-col bg-base-100">
				<div className="w-full p-6">{children}</div>
				<label
					htmlFor="my-drawer-2"
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
							<span>Student Portal</span>
						</div>
						<NotificationDropdown
							initialNotifications={initialNotifications}
							userEmail={userEmail}
						/>
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
							href="/main/student/profile"
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

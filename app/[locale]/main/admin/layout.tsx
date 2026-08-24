"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

const navItems = [
	{
		href: "/main/admin/dashboard",
		labelKey: "dashboard",
		icon: "fa-solid fa-chart-line",
	},
	{
		href: "/main/admin/teachers",
		labelKey: "teachers",
		icon: "fa-solid fa-chalkboard-user",
	},
	{
		href: "/main/admin/students",
		labelKey: "students",
		icon: "fa-solid fa-user-graduate",
	},
	{
		href: "/main/admin/classes",
		labelKey: "classes",
		icon: "fa-solid fa-school",
	},
	{
		href: "/main/admin/payments",
		labelKey: "payments",
		icon: "fa-solid fa-credit-card",
	},
	{
		href: "/main/admin/subjects",
		labelKey: "subjects",
		icon: "fa-solid fa-book",
	},
	{
		href: "/main/admin/refund-requests",
		labelKey: "refundRequests",
		icon: "fa-solid fa-rotate-left",
	},
	{
		href: "/main/admin/settings",
		labelKey: "settings",
		icon: "fa-solid fa-gear",
	},
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const { data: session } = useSession();
	const t = useTranslations("AdminLayout");

	return (
		<div className="drawer lg:drawer-open">
			<input
				id="admin-drawer"
				type="checkbox"
				className="drawer-toggle"
			/>

			{/* Main Content */}
			<div className="drawer-content flex flex-col bg-base-100 min-h-screen">
				{/* Page content */}
				<div className="p-6">{children}</div>

				{/* Mobile menu toggle */}
				<label
					htmlFor="admin-drawer"
					aria-label="Open menu"
					className="btn btn-primary drawer-button lg:hidden fixed bottom-4 left-4 shadow-lg"
				>
					<i className="fa-solid fa-bars"></i>
				</label>
			</div>

			{/* Sidebar */}
			<div className="drawer-side lg:!top-16 lg:!h-[calc(100dvh-4rem)]">
				<label
					htmlFor="admin-drawer"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>
				<aside className="menu bg-base-200 text-base-content h-full w-80 p-6 flex flex-col justify-between overflow-y-auto">
					<div>
						{/* Header / Logo */}
						<div className="flex items-center gap-3 mb-6">
							<div className="bg-primary text-primary-content p-3 rounded-xl">
								<i className="fa-solid fa-user-shield text-xl"></i>
							</div>
							<h2 className="text-lg font-bold">{t("panelName")}</h2>
						</div>

						{/* Navigation */}
						<ul className="menu gap-2">
							{navItems.map(({ href, labelKey, icon }) => (
								<li key={href}>
									<Link
										href={href}
										className={`flex items-center gap-3 font-medium transition-all duration-200 ${
											pathname === href
												? "active bg-primary text-primary-content"
												: "hover:bg-base-300 rounded-lg"
										}`}
									>
										<i className={icon}></i>
										{t(`nav.${labelKey}`)}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Footer section */}
					<div className="mt-8 border-t pt-4 text-sm text-base-content/50">
						<p className="font-semibold mb-1 text-base-content/70">{t("loggedInAs")}</p>
						<p className="truncate">{session?.user?.email ?? "—"}</p>
					</div>
				</aside>
			</div>
		</div>
	);
}

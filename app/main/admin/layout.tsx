"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
	{
		href: "/main/admin/dashboard",
		label: "Dashboard",
		icon: "fa-solid fa-chart-line",
	},
	{
		href: "/main/admin/teachers",
		label: "Teachers",
		icon: "fa-solid fa-chalkboard-user",
	},
	{
		href: "/main/admin/students",
		label: "Students",
		icon: "fa-solid fa-user-graduate",
	},
	{
		href: "/main/admin/classes",
		label: "Classes",
		icon: "fa-solid fa-school",
	},
	{
		href: "/main/admin/payments",
		label: "Payments",
		icon: "fa-solid fa-credit-card",
	},
	{
		href: "/main/admin/subjects",
		label: "Subjects",
		icon: "fa-solid fa-book",
	},
	{
		href: "/main/admin/settings",
		label: "Settings",
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
					className="btn btn-primary drawer-button lg:hidden fixed bottom-4 left-4 shadow-lg"
				>
					<i className="fa-solid fa-bars"></i>
				</label>
			</div>

			{/* Sidebar */}
			<div className="drawer-side">
				<label
					htmlFor="admin-drawer"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>
				<aside className="menu bg-base-200 text-base-content min-h-full w-80 p-6 flex flex-col justify-between">
					<div>
						{/* Header / Logo */}
						<div className="flex items-center gap-3 mb-6">
							<div className="bg-primary text-primary-content p-3 rounded-xl">
								<i className="fa-solid fa-user-shield text-xl"></i>
							</div>
							<h2 className="text-lg font-bold">Admin Panel</h2>
						</div>

						{/* Navigation */}
						<ul className="menu gap-2">
							{navItems.map(({ href, label, icon }) => (
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
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Footer section */}
					<div className="mt-8 border-t pt-4 text-sm text-base-content/50">
						<p className="font-semibold mb-1 text-base-content/70">Logged in as:</p>
						<p className="truncate">{session?.user?.email ?? "—"}</p>
					</div>
				</aside>
			</div>
		</div>
	);
}

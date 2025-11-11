"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ href: "/main/admin/dashboard", label: "Dashboard" },
	{ href: "/main/admin/teachers", label: "Teachers" },
	{ href: "/main/admin/students", label: "Students" },
	{ href: "/main/admin/classes", label: "Classes" },
	{ href: "/main/admin/payments", label: "Payments" },
	{ href: "/main/admin/subjects", label: "Subjects" },
	{ href: "/main/admin/settings", label: "Settings" },
];

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="flex h-screen">
			{/* Sidebar */}
			<aside className="w-64 bg-base-200 p-4 flex flex-col">
				<h2 className="text-xl font-bold mb-6">Admin</h2>
				<ul className="menu flex-1">
					{navItems.map((item) => (
						<li key={item.href}>
							<Link
								href={item.href}
								className={`rounded-lg ${
									pathname === item.href
										? "active font-semibold"
										: ""
								}`}
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>
			</aside>

			{/* Main content */}
			<main className="flex-1 p-6 overflow-y-auto bg-base-100">
				{children}
			</main>
		</div>
	);
}

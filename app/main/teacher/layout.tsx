"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TeacherLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const pathname = usePathname();

	const links = [
		{
			href: "/main/teacher/dashboard",
			icon: "fa-house-user",
			label: "Dashboard",
		},
		{
			href: "/main/teacher/classes",
			icon: "fa-school",
			label: "Classes",
		},
		{
			href: "/main/teacher/students",
			icon: "fa-user-graduate",
			label: "Students",
		},
		{
			href: "/main/teacher/earnings",
			icon: "fa-dollar-sign",
			label: "Earnings",
		},
	];

	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
			<div className="drawer-content flex flex-col items-center bg-base-100 min-h-screen">
				{/* Page content */}
				<div className="w-full p-6">{children}</div>

				{/* Mobile toggle button */}
				<label
					htmlFor="my-drawer-2"
					className="btn btn-primary drawer-button lg:hidden fixed bottom-4 left-4 shadow-lg"
				>
					<i className="fa-solid fa-bars"></i>
				</label>
			</div>

			{/* Sidebar */}
			<div className="drawer-side">
				<label
					htmlFor="my-drawer-2"
					aria-label="close sidebar"
					className="drawer-overlay"
				></label>

				{/* Sidebar Content */}
				<ul className="menu bg-base-200 text-base-content min-h-full w-64 p-4 gap-2">
					{/* Logo/Header */}
					<li className="mb-4">
						<div className="flex items-center justify-center gap-2 text-xl font-bold">
							<i className="fa-solid fa-graduation-cap text-primary"></i>
							<span>Teacher Panel</span>
						</div>
					</li>

					{/* Navigation Links */}
					{links.map((link) => {
						const isActive = pathname === link.href;
						return (
							<li key={link.href}>
								<Link
									href={link.href}
									className={`flex items-center gap-3 ${
										isActive
											? "bg-primary text-primary-content"
											: "hover:bg-base-300"
									}`}
								>
									<i
										className={`fa-solid ${link.icon} w-5`}
									></i>
									<span>{link.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const pathname = usePathname();

	const links = [
		{
			href: "/main/student/dashboard",
			icon: "fa-house-user",
			label: "Dashboard",
		},
		{
			href: "/main/student/classes",
			icon: "fa-school",
			label: "Classes",
		},
		{
			href: "/main/student/teachers",
			icon: "fa-chalkboard-user",
			label: "Teachers",
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
				<aside className="menu bg-base-200 text-base-content min-h-full w-80 p-6 flex flex-col justify-between">
					<div>
						{/* Logo / Header */}
						<div className="flex items-center gap-3 mb-6">
							<div className="bg-primary text-primary-content p-3 rounded-xl">
								<i className="fa-solid fa-graduation-cap text-xl"></i>
							</div>
							<h2 className="text-lg font-bold">
								Student Portal
							</h2>
						</div>

						<ul className="menu gap-2">
							{links.map(({ href, icon, label }) => (
								<li key={href}>
									<Link
										href={href}
										className={`flex items-center gap-3 font-medium ${
											pathname === href
												? "active bg-primary text-primary-content"
												: "hover:bg-base-300 rounded-lg"
										}`}
									>
										<i className={`fa-solid ${icon}`}></i>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Optional Footer Section */}
					<div className="mt-8 border-t pt-4 text-sm text-gray-500">
						<p className="font-semibold mb-1">Logged in as:</p>
						<p>student@example.com</p>
					</div>
				</aside>
			</div>
		</div>
	);
}

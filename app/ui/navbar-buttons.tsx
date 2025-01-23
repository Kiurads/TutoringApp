import { auth, signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";

export default async function NavbarButtons() {
	const session = await auth();

	if (session) {
		const avatar = `https://api.dicebear.com/9.x/avataaars-neutral/svg?&seed=${session.user?.email}`;

		return (
			<div className="dropdown dropdown-end">
				<div
					tabIndex={0}
					role="button"
					className="btn btn-ghost btn-circle avatar"
				>
					<div className="w-10 rounded-full">
						<Image
							alt="User Avatar"
							width={1000}
							height={1000}
							src={avatar}
						/>
					</div>
				</div>
				<ul
					tabIndex={0}
					className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
				>
					<li>
						<a className="justify-between">
							Profile
							<span className="badge">New</span>
						</a>
					</li>
					<li>
						<a>Settings</a>
					</li>
					<li>
						<Link href="/signout" className="justify-between">
							Logout
						</Link>
					</li>
				</ul>
			</div>
		);
	} else {
		return (
			<div className="flex items-center">
				<div className="mx-2">
					<Link href="/register/student" className="btn btn-primary">
						<i className="fa-solid fa-user-plus text-l"></i>
						Register
					</Link>
				</div>
				<div className="mx-2">
					<Link href="/login" className="btn btn-outline">
						<i className="fa-solid fa-user text-l"></i>
						Login
					</Link>
				</div>
			</div>
		);
	}
}

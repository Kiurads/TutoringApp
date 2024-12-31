import Link from "next/link";
import ThemeChanger from "./theme-changer";
import Logo from "./logo";

export default function Navbar() {
	return (
		<div className="md:pl-56 md:pr-56 bg-base-300">
			<div className="navbar bg-base-300 md:pl-6 md:mr-6">
				<div className="flex-1">
					<Link href="/" className="btn btn-ghost text-xl">
						<Logo />
					</Link>
				</div>
				<div className="flex-none gap-2">
					<Link href="/register" className="btn btn-primary">
						<i className="fa-solid fa-user-plus text-l"></i>
						Register
					</Link>
					<Link href="/login" className="btn btn-outline">
						<i className="fa-solid fa-user text-l"></i>
						Login
					</Link>
					<ThemeChanger />
				</div>
			</div>
		</div>
	);
}

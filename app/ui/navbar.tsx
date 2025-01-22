import Link from "next/link";
import ThemeChanger from "./theme-changer";
import Logo from "./logo";
import NavbarButtons from "./navbar-buttons";

export default async function Navbar() {
	return (
		<div className="navbar bg-base-300">
			<div className="flex-1">
				<Link href="/" className="btn btn-ghost text-xl">
					<Logo />
				</Link>
			</div>
			<NavbarButtons />
			<ThemeChanger />
		</div>
	);
}

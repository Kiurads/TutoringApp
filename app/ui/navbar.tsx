import Link from "next/link";
import ThemeChanger from "./theme-changer";
import Logo from "./logo";
import NavbarButtons from "./navbar-buttons";

export default async function Navbar() {
	return (
		<div className="navbar bg-base-300">
			{/* Left Section */}
			<div className="flex-1">
				<Link href="/" className="btn btn-ghost text-xl">
					<Logo />
				</Link>
			</div>

			{/* Right Section */}
			<div className="flex items-center gap-4">
				{/* NavbarButtons: Hidden on small screens */}
				<NavbarButtons />
				{/* ThemeChanger: Always visible */}
				<ThemeChanger />
			</div>
		</div>
	);
}

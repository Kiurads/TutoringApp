import { auth } from "@/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NavbarButtons() {
	const [session, t] = await Promise.all([auth(), getTranslations("Navbar")]);

	if (session && session.user && session.user.email) {
		return (
			<Link href="/signout" className="btn btn-outline btn-sm gap-2">
				<i className="fa-solid fa-right-from-bracket" />
				{t("signOut")}
			</Link>
		);
	} else {
		return (
			<div className="items-center hidden md:flex">
				<div className="mx-2">
					<Link href="/register/student" className="btn btn-primary">
						<i className="fa-solid fa-user-plus text-l"></i>
						{t("register")}
					</Link>
				</div>
				<div className="mx-2">
					<Link href="/login" className="btn btn-outline">
						<i className="fa-solid fa-user text-l"></i>
						{t("login")}
					</Link>
				</div>
			</div>
		);
	}
}

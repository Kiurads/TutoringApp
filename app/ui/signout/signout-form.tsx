import { signOut } from "@/auth";
import { redirect } from "next/navigation";
import Logo from "@/app/ui/logo";

export default function SignOutForm() {
	return (
		<form
			action={async () => {
				"use server";
				await signOut({ redirect: false });
				redirect("/login");
			}}
			className="card-body"
		>
			<div className="flex justify-center pb-4">
				<Logo />
			</div>
			<div className="form-control text-center text-bold text-md">
				<p className="">Do you want to be signed out?</p>
			</div>
			<div className="pt-2 col-span-6 flex items-center gap-4">
				<button className="grow btn btn-primary">Sign Out</button>
			</div>
		</form>
	);
}

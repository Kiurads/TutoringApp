import { signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Logo from "@/app/ui/logo";

export default async function SignOutForm() {
	const t = await getTranslations("SignOutForm");

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
				<p className="">{t("confirm")}</p>
			</div>
			<div className="pt-2 col-span-6 flex items-center gap-4">
				<button className="grow btn btn-primary">{t("submit")}</button>
			</div>
		</form>
	);
}

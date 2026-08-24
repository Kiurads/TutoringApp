"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AddClassButton() {
	const t = useTranslations("AddClassButton");

	return (
		<Link
			href="/main/student/classes/request"
			aria-label={t("newClass")}
			className="btn btn-primary flex items-center gap-2 px-4 py-2"
		>
			<i className="fa-solid fa-calendar-plus text-primary-content"></i>
			<span className="hidden text-primary-content md:inline">
				{t("newClass")}
			</span>
		</Link>
	);
}

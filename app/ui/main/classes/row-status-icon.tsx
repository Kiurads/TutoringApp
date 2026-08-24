"use client";

import { useTranslations } from "next-intl";

// The booked-classes tables mark a row as pending/unpaid with a colored
// left border alone — no backup for colorblind users. This renders a small
// icon (with a title/aria-label) alongside that same color, so the signal
// doesn't depend on color perception.
export default function RowStatusIcon({
	isPending,
	isUnpaid,
}: {
	isPending: boolean;
	isUnpaid: boolean;
}) {
	const t = useTranslations("RowStatusIcon");

	if (isPending) {
		return (
			<i
				className="fa-solid fa-hourglass-half text-warning text-xs ml-1.5"
				title={t("pending")}
				aria-label={t("pending")}
			></i>
		);
	}
	if (isUnpaid) {
		return (
			<i
				className="fa-solid fa-circle-exclamation text-error text-xs ml-1.5"
				title={t("unpaid")}
				aria-label={t("unpaid")}
			></i>
		);
	}
	return null;
}

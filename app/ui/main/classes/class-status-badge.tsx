"use client";

import { useTranslations } from "next-intl";

export default function ClassStatusBadge(props: { status: string }) {
	const { status } = props;
	const t = useTranslations("ClassStatusBadge");

	return (
		<span
			className={`badge badge-outline capitalize ${
				status === "completed"
					? "badge-success"
					: status === "scheduled"
					? "badge-info"
					: status === "refused" || status === "cancelled"
					? "badge-error"
					: "badge-warning"
			}`}
		>
			{t.has(status) ? t(status) : status}
		</span>
	);
}

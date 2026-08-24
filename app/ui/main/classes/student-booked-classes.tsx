"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useIntlLocale from "@/app/utils/use-intl-locale";
import AddClassButton from "./add-class-button";
import ClassesTableButtons from "./student-table-buttons";
import ClassStatusBadge from "./class-status-badge";
import ClassPaidIcon from "./paid-icon";
import RowStatusIcon from "./row-status-icon";
import { BookedClass } from "@/app/lib/types/classes.types";
import { canPayForClass } from "@/app/lib/classes/can-pay-for-class";

type Filter = "all" | "pending" | "unpaid";

function isPending(c: BookedClass) {
	return c.status === "requested";
}

const isUnpaid = canPayForClass;

function firstCellBorder(c: BookedClass, filter: Filter) {
	if (filter !== "all") return "border-l-4 border-transparent";
	if (isPending(c)) return "border-l-4 border-warning";
	if (isUnpaid(c)) return "border-l-4 border-error";
	return "border-l-4 border-transparent";
}

export default function BookedClasses(props: { bookedClasses: BookedClass[] }) {
	const { bookedClasses } = props;
	const router = useRouter();
	const t = useTranslations("StudentBookedClasses");
	const intlLocale = useIntlLocale("en-GB");
	const [filter, setFilter] = useState<Filter>("all");

	const pendingCount = bookedClasses.filter(isPending).length;
	const unpaidCount = bookedClasses.filter(isUnpaid).length;

	const filtered = bookedClasses.filter((c) => {
		if (filter === "pending") return isPending(c);
		if (filter === "unpaid") return isUnpaid(c);
		return true;
	});

	const tabs: { key: Filter; label: string; count: number; badgeClass: string }[] = [
		{ key: "all", label: t("tabAll"), count: bookedClasses.length, badgeClass: "badge-ghost" },
		{ key: "pending", label: t("tabPending"), count: pendingCount, badgeClass: "badge-warning" },
		{ key: "unpaid", label: t("tabUnpaid"), count: unpaidCount, badgeClass: "badge-error" },
	];

	return (
		<div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">{t("title")}</h2>
				<AddClassButton />
			</div>

			{bookedClasses.length === 0 ? (
				<p className="text-center py-10 text-base-content/50">
					{t("noClasses")}
				</p>
			) : (
				<>
					{/* Filter tabs */}
					<div className="flex gap-2 px-4 py-3 border-b border-base-300">
						{tabs.map(({ key, label, count, badgeClass }) => (
							<button
								key={key}
								onClick={() => setFilter(key)}
								className={`btn btn-sm gap-2 ${filter === key ? "btn-primary" : "btn-ghost"}`}
							>
								{label}
								<span className={`badge badge-sm ${filter === key ? "badge-primary-content" : badgeClass}`}>
									{count}
								</span>
							</button>
						))}
					</div>

					{filtered.length === 0 ? (
						<p className="text-center py-10 text-base-content/50">
							{t("noClassesInCategory")}
						</p>
					) : (
						<table className="min-w-full divide-y divide-base-300 text-sm">
							<thead>
								<tr className="bg-base-200">
									<th className="px-3 py-2 font-medium text-base-content text-left">{t("subject")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left hidden sm:table-cell">{t("teacher")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left">{t("date")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left hidden md:table-cell">{t("duration")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left hidden md:table-cell">{t("price")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left">{t("status")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left hidden sm:table-cell">{t("paid")}</th>
									<th className="px-3 py-2 font-medium text-base-content text-left">{t("actions")}</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-base-300">
								{filtered.map((classData) => (
									<tr
										key={classData.id}
										className="hover:bg-base-200 transition-colors cursor-pointer"
										onClick={() => router.push(`/main/student/classes/${classData.id}`)}
									>
										<td className={`px-3 py-2 font-medium text-base-content capitalize ${firstCellBorder(classData, filter)}`}>
											{classData.subject.name}
											<RowStatusIcon isPending={isPending(classData)} isUnpaid={isUnpaid(classData)} />
										</td>
										<td className="px-3 py-2 text-base-content hidden sm:table-cell">
											{classData.teacher?.name ?? (
												<span className="badge badge-warning badge-sm">{t("finding")}</span>
											)}
										</td>
										<td className="px-3 py-2 text-base-content text-xs whitespace-nowrap">
											<span className="block">
												{classData.startTime.toLocaleDateString(intlLocale, { day: "numeric", month: "short", year: "numeric" })}
											</span>
											<span className="text-base-content/50">
												{classData.startTime.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })}
											</span>
										</td>
										<td className="px-3 py-2 text-base-content hidden md:table-cell">
											{classData.durationInHours}
										</td>
										<td className="px-3 py-2 text-base-content hidden md:table-cell">
											{classData.totalPrice}€
										</td>
										<td className="px-3 py-2">
											<ClassStatusBadge status={classData.status} />
										</td>
										<td className="px-3 py-2 hidden sm:table-cell">
											<ClassPaidIcon status={classData.paid} />
										</td>
										<td
											className="px-3 py-2"
											onClick={(e) => e.stopPropagation()}
										>
											<ClassesTableButtons bookedClass={classData} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</>
			)}
		</div>
	);
}

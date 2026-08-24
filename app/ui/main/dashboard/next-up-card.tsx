import prisma from "@/prisma";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import getIntlLocale from "@/app/utils/get-intl-locale";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NextUpCard({ userEmail }: { userEmail: string }) {
	const [user, t, intlLocale] = await Promise.all([
		fetchUserByEmail(userEmail),
		getTranslations("NextUpCard"),
		getIntlLocale("en-US"),
	]);
	if (!user) return null;

	const next = await prisma.class.findFirst({
		where: {
			status: "scheduled",
			startTime: { gt: new Date() },
			OR: [{ studentId: user.id }, { teacherId: user.id }],
		},
		orderBy: { startTime: "asc" },
		include: {
			subject: { select: { name: true } },
			teacher: { select: { firstName: true, lastName: true } },
			student: { select: { firstName: true, lastName: true } },
		},
	});

	if (!next) {
		return (
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body">
					<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
						{t("title")}
					</h3>
					<p className="text-base-content/40 text-sm">
						{t("noUpcoming")}
					</p>
				</div>
			</div>
		);
	}

	const isStudent = user.role === "student";
	const otherParty = isStudent
		? next.teacher
			? `${next.teacher.firstName} ${next.teacher.lastName}`
			: t("tbd")
		: `${next.student.firstName} ${next.student.lastName}`;

	const detailPath = isStudent
		? `/main/student/classes/${next.id}`
		: `/main/teacher/classes/${next.id}`;

	const now = new Date();
	const msUntil = next.startTime.getTime() - now.getTime();
	const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24));
	const hoursUntil = Math.floor((msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	let timeLabel = "";
	if (daysUntil > 0) timeLabel = t("inDaysHours", { days: daysUntil, hours: hoursUntil });
	else if (hoursUntil > 0) timeLabel = t("inHours", { hours: hoursUntil });
	else timeLabel = t("soon");

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-3">
				<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
					{t("title")}
				</h3>
				<div className="flex items-start justify-between gap-3">
					<div className="flex flex-col gap-1 min-w-0">
						<p className="font-semibold truncate">{next.subject.name}</p>
						<p className="text-sm text-base-content/60 truncate">
							{isStudent ? t("with") : t("studentLabel")} {otherParty}
						</p>
						<p className="text-sm text-base-content/60">
							{next.startTime.toLocaleDateString(intlLocale, {
								weekday: "short",
								month: "short",
								day: "numeric",
							})}{" "}
							{t("at")}{" "}
							{next.startTime.toLocaleTimeString(intlLocale, {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
					<span className="badge badge-primary shrink-0">{timeLabel}</span>
				</div>
				<Link href={detailPath} className="btn btn-sm btn-outline mt-1 w-full sm:w-fit">
					{t("viewDetails")}
				</Link>
			</div>
		</div>
	);
}

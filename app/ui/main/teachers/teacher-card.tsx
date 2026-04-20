import { TeacherExtended } from "@/app/lib/types/teachers.types";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import Link from "next/link";

function FitBadge({ score }: { score: number }) {
	if (score === 0) return null;
	const color =
		score >= 80
			? "badge-success"
			: score >= 50
				? "badge-warning"
				: "badge-ghost border-base-300";
	return (
		<span className={`badge badge-sm font-semibold gap-1 ${color}`}>
			<i className="fa-solid fa-star-half-stroke text-[0.6rem]" />
			{score}% match
		</span>
	);
}

export default function TeacherCard({
	teacher,
	showFitScore = false,
}: {
	teacher: TeacherExtended;
	showFitScore?: boolean;
}) {
	return (
		<Link
			href={`/main/student/teachers/${teacher.id}`}
			className="relative flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200 hover:bg-base-100 hover:shadow-md transition-all h-full"
		>
			<span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

			<div className="p-5 flex flex-col flex-1 gap-3">
				{/* Header row */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-base truncate">{teacher.name}</h3>
						<span
							className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${
								teacher.isOnline
									? "text-success"
									: "text-base-content/40"
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${
									teacher.isOnline
										? "bg-success animate-pulse"
										: "bg-base-content/30"
								}`}
							/>
							{teacher.isOnline ? "Available" : "Offline"}
						</span>
					</div>
					<Image
						alt=""
						width={48}
						height={48}
						src={getAvatar(teacher.email)} unoptimized
						className="size-12 rounded-lg object-cover shadow-sm shrink-0"
					/>
				</div>

				{/* Fit score badge */}
				{showFitScore && teacher.fitScore != null && (
					<FitBadge score={teacher.fitScore} />
				)}

				{/* Bio */}
				{teacher.bio && (
					<p className="text-sm text-base-content/70 line-clamp-2">
						{teacher.bio}
					</p>
				)}

				{/* Subjects */}
				{teacher.subjects.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{teacher.subjects.map((subject) => (
							<span key={subject} className="badge badge-outline badge-sm">
								{subject}
							</span>
						))}
					</div>
				)}

				{/* Footer stats */}
				<div className="mt-auto pt-3 border-t border-base-300 flex items-center justify-between">
					<div className="flex items-center gap-1 text-sm">
						<span className="text-warning">★</span>
						<span className="font-medium">
							{teacher.rating === "No Reviews" ? "No reviews" : teacher.rating}
						</span>
					</div>
					<div className="text-sm font-semibold">
						{teacher.pricePerHour}€
						<span className="text-xs font-normal text-base-content/50">/hr</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

import UserCard from "../../users/user-card";
import ClassStatusBadge from "../class-status-badge";
import { decimalStringToHours } from "@/utils/decimal-to-time";
import { ClassData } from "@/app/lib/types/classes.types";

const STATUS_BORDER: Record<string, string> = {
	requested:  "bg-warning",
	scheduled:  "bg-info",
	completed:  "bg-success",
	refused:    "bg-error",
};

export default function ClassInfoCard({ classDetails }: { classDetails: ClassData }) {
	const borderColor = STATUS_BORDER[classDetails.status] ?? "bg-base-300";

	const startDate = new Date(classDetails.startTime);
	const createdDate = new Date(classDetails.createdAt);

	return (
		<div className="card bg-base-200 shadow-lg overflow-hidden">
			{/* Colored status bar */}
			<span className={`h-1 w-full block ${borderColor}`} />

			<div className="card-body gap-6">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-1">Subject</p>
						<h2 className="text-2xl font-bold capitalize">{classDetails.subject}</h2>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{classDetails.paid ? (
							<span className="badge badge-success gap-1">
								<i className="fa-solid fa-circle-check text-xs"></i> Paid
							</span>
						) : (
							<span className="badge badge-ghost gap-1">
								<i className="fa-solid fa-clock text-xs"></i> Unpaid
							</span>
						)}
						<ClassStatusBadge status={classDetails.status} />
					</div>
				</div>

				{/* People */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-2">Student</p>
						<UserCard user={classDetails.student} />
					</div>
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-2">Teacher</p>
						{classDetails.teacher ? (
							<UserCard user={classDetails.teacher} />
						) : (
							<div className="flex items-center gap-3 h-full rounded-lg border border-warning p-4">
								<i className="fa-solid fa-hourglass-half text-warning text-xl"></i>
								<div>
									<p className="font-semibold text-warning text-sm">Waiting for a teacher</p>
									<p className="text-xs text-base-content/50 mt-0.5">
										An available teacher will claim this request
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Details grid */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-base-300">
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-1">Start Time</p>
						<p className="font-semibold text-sm">
							{startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
						</p>
						<p className="text-xs text-base-content/60">
							{startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
						</p>
					</div>
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-1">Duration</p>
						<p className="font-semibold text-sm">{decimalStringToHours(classDetails.durationInHours)}</p>
					</div>
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-1">Total Price</p>
						<p className="font-semibold text-sm">
							{classDetails.totalPrice === "0" ? (
								<span className="text-base-content/40 italic">TBD</span>
							) : (
								`${classDetails.totalPrice}€`
							)}
						</p>
					</div>
					<div>
						<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium mb-1">Requested On</p>
						<p className="font-semibold text-sm">
							{createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

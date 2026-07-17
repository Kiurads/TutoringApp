import { RegularClassData } from "@/app/lib/types/regular-classes.types";
import RegularClassActionModals from "./regular-class-action-modals";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusBadge({ status }: { status: string }) {
	const cls =
		status === "active"
			? "badge-success"
			: status === "requested"
				? "badge-warning"
				: "badge-ghost";
	return <span className={`badge badge-sm ${cls}`}>{status}</span>;
}

export default function RegularClassesTable({
	regularClasses,
	role,
}: {
	regularClasses: RegularClassData[];
	role: "student" | "teacher";
}) {
	if (regularClasses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-2 text-base-content/30">
				<i className="fa-solid fa-rotate text-4xl"></i>
				<p className="text-sm">No recurring classes yet.</p>
			</div>
		);
	}

	return (
		<div className="card bg-base-200 shadow overflow-hidden">
			<div className="overflow-x-auto">
				<table className="table table-sm">
					<thead>
						<tr>
							<th>{role === "student" ? "Teacher" : "Student"}</th>
							<th>Subject</th>
							<th>Day</th>
							<th>Time</th>
							<th>Duration</th>
							<th>Price</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{regularClasses.map((rc) => {
							const otherParty = role === "student" ? rc.teacher : rc.student;
							return (
								<tr key={rc.id} className="hover">
									<td className="capitalize">{otherParty.name}</td>
									<td className="capitalize">{rc.subject}</td>
									<td>{DAY_NAMES[rc.dayOfWeek]}</td>
									<td>{rc.startTime}</td>
									<td>{rc.durationInHours}h</td>
									<td>{rc.totalPrice}€</td>
									<td>
										<StatusBadge status={rc.status} />
									</td>
									<td>
										<RegularClassActionModals
											id={rc.id}
											subject={rc.subject}
											otherPartyName={otherParty.name}
											canAccept={role === "teacher" && rc.status === "requested"}
											canRefuse={role === "teacher" && rc.status === "requested"}
											canCancel={rc.status === "requested" || rc.status === "active"}
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

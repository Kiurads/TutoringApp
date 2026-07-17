import { fetchUpcomingClassesByUser } from "@/app/lib/actions/classes.actions";
import { decimalStringToHours } from "@/utils/decimal-to-time";
import ClassStatusBadge from "../../classes/class-status-badge";

export default async function UpcomingClasses(props: { userEmail: string }) {
	const upcomingClasses = await fetchUpcomingClassesByUser(props.userEmail);

	return (
		<div className="rounded-lg border border-base-300 bg-base-100">
			<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">Upcoming Classes</h2>
				{upcomingClasses && upcomingClasses.length > 0 && (
					<span className="badge badge-primary">{upcomingClasses.length}</span>
				)}
			</div>

			{!upcomingClasses || upcomingClasses.length === 0 ? (
				<p className="text-center py-10 text-base-content/50">
					No upcoming classes scheduled.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full divide-y divide-base-300 text-sm">
						<thead>
							<tr className="bg-base-200">
								<th className="px-3 py-2 font-medium text-base-content text-left">Subject</th>
								<th className="px-3 py-2 font-medium text-base-content text-left hidden sm:table-cell">Teacher</th>
								<th className="px-3 py-2 font-medium text-base-content text-left">Date</th>
								<th className="px-3 py-2 font-medium text-base-content text-left hidden md:table-cell">Duration</th>
								<th className="px-3 py-2 font-medium text-base-content text-left hidden md:table-cell">Price</th>
								<th className="px-3 py-2 font-medium text-base-content text-left">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-base-300">
							{upcomingClasses.map((classData) => (
								<tr key={classData.id} className="hover:bg-base-200 transition-colors">
									<td className="px-3 py-2 font-medium text-base-content capitalize">
										{classData.subject}
									</td>
									<td className="px-3 py-2 text-base-content capitalize hidden sm:table-cell">
										{classData.teacher?.name ?? (
											<span className="badge badge-warning badge-sm">TBD</span>
										)}
									</td>
									<td className="px-3 py-2 text-base-content text-xs whitespace-nowrap">
										{new Date(classData.startTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
										<span className="block text-base-content/50">
											{new Date(classData.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
										</span>
									</td>
									<td className="px-3 py-2 text-base-content hidden md:table-cell">
										{decimalStringToHours(classData.durationInHours)}
									</td>
									<td className="px-3 py-2 text-base-content hidden md:table-cell">
										{classData.totalPrice.toString()}€
									</td>
									<td className="px-3 py-2">
										<ClassStatusBadge status={classData.status} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

import { fetchUpcomingClassesByUser } from "@/app/utils/classes.actions";
import decimalToHours from "@/utils/decimal-to-time";

export default async function UpcomingClasses(props: { userEmail: string }) {
	const upcomingClasses = await fetchUpcomingClassesByUser(props.userEmail);

	if (!upcomingClasses || upcomingClasses.length === 0) {
		return (
			<div className="overflow-x-auto rounded-lg border border-base-content">
				<h2 className="text-center text-lg font-bold py-4">
					<i className="fa-solid fa-chalkboard-user text-l"></i>{" "}
					Upcoming classes
				</h2>
				<h2 className="text-center text-lg py-4">
					You have no upcoming classes{" "}
					<i className="fa-solid fa-face-laugh-wink"></i>
				</h2>
			</div>
		);
	} else {
		return (
			<div className="overflow-x-auto rounded-lg border border-base-content">
				<h2 className="text-center text-lg font-bold py-4">
					Upcoming classes{" "}
					<div className="badge badge-outline">
						{upcomingClasses.length}
					</div>
				</h2>
				<table className="min-w-full divide-y-2 divide-base-300 bg-base text-sm table-auto">
					<thead className="ltr:text-left rtl:text-right">
						<tr>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Subject
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Teacher
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Start Time
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Duration
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Price
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Status
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-base-300">
						{upcomingClasses.map((classData) => (
							<tr
								key={classData.id}
								className="hover:bg-base-200 transition-all"
							>
								<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content capitalize">
									{classData.subject.name}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
									{classData.teacher.user.firstName +
										" " +
										classData.teacher.user.lastName}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{classData.startTime.toUTCString()}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{decimalToHours(classData.durationInHours)}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{classData.totalPrice.toString() + "€"}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
									<div className="badge badge-outline">
										{classData.status}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}

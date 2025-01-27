import { fetchUpcomingClassesByUser } from "@/app/utils/classes.actions";

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
					<i className="fa-solid fa-chalkboard-user text-l"></i>{" "}
					Upcoming classes
				</h2>
				<table className="min-w-full divide-y-2 divide-base-300 bg-base text-sm">
					<thead className="ltr:text-left rtl:text-right">
						<tr>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
								Name
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
								Date of Birth
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
								Role
							</th>
							<th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
								Salary
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-base-300">
						<tr>
							<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content">
								John Doe
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								24/05/1995
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								Web Developer
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								$120,000
							</td>
						</tr>

						<tr>
							<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content">
								Jane Doe
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								04/11/1980
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								Web Designer
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								$100,000
							</td>
						</tr>

						<tr>
							<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content">
								Gary Barlow
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								24/05/1995
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								Singer
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-base-content">
								$20,000
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}

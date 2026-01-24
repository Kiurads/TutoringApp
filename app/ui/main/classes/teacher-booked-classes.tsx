"use client";

import { useRouter } from "next/navigation";
import AddClassButton from "@/app/ui/main/classes/create/teacher/add-class-button";
import ClassesTableButtons from "./teacher-table-buttons";
import ClassStatusBadge from "./class-status-badge";
import ClassPaidIcon from "./paid-icon";
import { BookedClass } from "@/app/lib/types/classes.types";

export default function BookedClasses(props: { bookedClasses: BookedClass[] }) {
	const { bookedClasses } = props;
	const router = useRouter();

	if (!bookedClasses || bookedClasses.length === 0) {
		return (
			<div className="rounded-lg border border-base-content">
				<h2 className="text-lg font-semibold flex items-center justify-between px-4 py-4">
					<span className="flex items-center gap-2">
						<i className="fa-solid fa-chalkboard-user"></i> Booked
						Classes
					</span>
					<AddClassButton />
				</h2>
				<h2 className="text-center text-lg py-4">
					You have no booked classes{" "}
					<i className="fa-solid fa-face-laugh-wink"></i>
				</h2>
			</div>
		);
	} else {
		return (
			<div className="rounded-lg border border-base-content">
				<h2 className="text-lg font-semibold flex items-center justify-between px-4 py-4">
					<span className="flex items-center gap-2">
						Booked classes{" "}
						<div className="badge badge-outline">
							{bookedClasses.length}
						</div>
					</span>
					<AddClassButton />
				</h2>
				<table className="w-full divide-y-2 divide-base-300 bg-base text-sm">
					<thead className="ltr:text-left rtl:text-right">
						<tr>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Student
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Start Time
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Duration
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Price
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Status
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Paid
							</th>
							<th className="px-2 py-2 font-medium text-base-content text-left">
								Actions
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-base-300">
						{bookedClasses.map((classData) => (
							<tr
								key={classData.id}
								className="hover:bg-base-200 transition-all cursor-pointer"
								onClick={() =>
									router.push(
										`/main/teacher/classes/${classData.id}`,
									)
								}
							>
								<td className="px-2 py-2 text-base-content capitalize">
									{classData.student.name}
								</td>
								<td className="px-2 py-2 text-base-content text-xs">
									{classData.startTime.toUTCString()}
								</td>
								<td className="px-2 py-2 text-base-content">
									{classData.durationInHours}
								</td>
								<td className="px-2 py-2 text-base-content">
									{classData.totalPrice + "€"}
								</td>
								<td className="px-2 py-2 text-base-content capitalize">
									<ClassStatusBadge
										status={classData.status}
									/>
								</td>
								<td className="px-2 py-2 text-base-content capitalize">
									<ClassPaidIcon status={classData.paid} />
								</td>
								{/* Exclude buttons from navigation */}
								<td
									className="px-2 py-2 text-base-content"
									onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
								>
									<ClassesTableButtons
										bookedClass={classData}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}

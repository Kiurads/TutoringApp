"use client";

import { useRouter } from "next/navigation";
import AddClassButton from "./add-class-button";
import ClassesTableButtons from "./table-buttons";
import ClassStatusBadge from "./class-status-badge";
import ClassPaidIcon from "./paid-icon";

export interface BookedClass {
	id: string;
	durationInHours: string;
	startTime: Date;
	totalPrice: string;
	status: string;
	requestedBySelf: boolean;
	paid: boolean;
	student: {
		name: string;
	};
	teacher: {
		name: string;
	};
	subject: {
		name: string;
	};
}

export default function BookedClasses(props: { bookedClasses: BookedClass[] }) {
	const { bookedClasses } = props;
	const router = useRouter();

	if (!bookedClasses || bookedClasses.length === 0) {
		return (
			<div className="overflow-x-auto rounded-lg border border-base-content">
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
			<div className="overflow-x-auto rounded-lg border border-base-content">
				<h2 className="text-lg font-semibold flex items-center justify-between px-4 py-4">
					<span className="flex items-center gap-2">
						Booked classes{" "}
						<div className="badge badge-outline">
							{bookedClasses.length}
						</div>
					</span>
					<AddClassButton />
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
							<th className="whitespace-nowrap px-4 py-2 font-medium text-base-content text-left">
								Paid
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-base-300">
						{bookedClasses.map((classData) => (
							<tr
								key={classData.id}
								className="hover:bg-base-200 transition-all cursor-pointer"
								onClick={() =>
									router.push(`/main/classes/${classData.id}`)
								}
							>
								<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content capitalize">
									{classData.subject.name}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
									{classData.teacher.name}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{classData.startTime.toUTCString()}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{classData.durationInHours}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content">
									{classData.totalPrice + "€"}
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
									<ClassStatusBadge
										status={classData.status}
									/>
								</td>
								<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
									<ClassPaidIcon status={classData.paid} />
								</td>
								{/* Exclude buttons from navigation */}
								<td
									className="whitespace-nowrap px-4 py-2 text-base-content"
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

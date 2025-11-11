"use client";

import Link from "next/link";
import { BookedClass } from "./booked-classes";

export default function ClassesTableButtons(props: {
	bookedClass: BookedClass;
}) {
	const { bookedClass } = props;

	if (bookedClass.requestedBySelf && bookedClass.status === "requested") {
		return (
			<div className="flex flex-row gap-2 w-full">
				<div className="flex-1">
					<Link
						href={`/main/student/classes/${bookedClass.id}/cancel`}
						className={
							bookedClass.paid
								? "btn btn-error btn-sm tooltip w-full"
								: "btn btn-error btn-sm tooltip w-full"
						}
						data-tip="Cancel Class"
					>
						<i className="fa-solid fa-trash"></i>
					</Link>
				</div>
			</div>
		);
	} else {
		if (bookedClass.status === "requested") {
			return (
				<div className="flex flex-row gap-2 w-full">
					<div className="flex-1">
						<Link
							href={`/main/student/classes/${bookedClass.id}/accept`}
							className="btn btn-success btn-sm tooltip w-full"
							data-tip="Accept Request"
						>
							<i className="fa-solid fa-check"></i>
						</Link>
					</div>

					<div className="flex-1">
						<Link
							href={`/main/student/classes/${bookedClass.id}/refuse`}
							className="btn btn-error btn-sm tooltip w-full"
							data-tip="Refuse Request"
						>
							<i className="fa-solid fa-x"></i>
						</Link>
					</div>
				</div>
			);
		}
		if (
			bookedClass.status === "scheduled" ||
			bookedClass.status === "completed"
		)
			return (
				<div className="flex flex-row gap-2 w-full">
					{!bookedClass.paid && (
						<div className="flex-1">
							<Link
								href={`/main/student/classes/${bookedClass.id}/pay`}
								className="btn btn-success btn-sm tooltip w-full"
								data-tip="Pay for Class"
							>
								<i className="fa-solid fa-money-bill-wave"></i>
							</Link>
						</div>
					)}
				</div>
			);
	}
}

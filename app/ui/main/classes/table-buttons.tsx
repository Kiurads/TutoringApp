"use client";

import Link from "next/link";
import { BookedClass } from "./booked-classes";

export default function ClassesTableButtons(props: {
	bookedClass: BookedClass;
}) {
	const { bookedClass } = props;

	if (bookedClass.requestedBySelf) {
		return (
			<div className="join flex flex-row">
				<Link
					href={`/main/classes/${bookedClass.id}`}
					className="btn btn-info btn-sm join-item basis-1/2"
				>
					<i className="fa-solid fa-info"></i>
				</Link>
				<Link
					href={`/main/classes/${bookedClass.id}/cancel`}
					className="btn btn-error btn-sm join-item basis-1/2"
				>
					<i className="fa-solid fa-trash"></i>
				</Link>
			</div>
		);
	} else {
		if (bookedClass.status === "requested") {
			return (
				<div className="join flex flex-row gap-2">
					<Link
						href={`/main/classes/${bookedClass.id}/accept`}
						className="btn btn-success btn-sm join-item basis-1/2"
					>
						<i className="fa-solid fa-check"></i>
					</Link>
					<Link
						href={`/main/classes/${bookedClass.id}/refuse`}
						className="btn btn-error btn-sm join-item basis-1/2"
					>
						<i className="fa-solid fa-x"></i>
					</Link>
				</div>
			);
		}

		return (
			<div className="join flex flex-row">
				<Link
					href={`/main/classes/${bookedClass.id}`}
					className="btn btn-info btn-sm join-item basis-1/2"
				>
					<i className="fa-solid fa-info"></i>
				</Link>
			</div>
		);
	}
}

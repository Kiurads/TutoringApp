import React from "react";
import UserCard from "../../users/user-card";
import ClassStatusBadge from "../class-status-badge";
import { decimalStringToHours } from "@/utils/decimal-to-time";
import Link from "next/link";
import ClassData from "@/app/lib/types/classes.types";

export default function ClassInfoCard(props: { classDetails: ClassData }) {
	const { classDetails } = props;

	return (
		<div className="card bg-base-100 shadow-lg rounded-lg overflow-hidden">
			<div className="p-6">
				{/* Header with Class Details and Status Badge */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-3xl font-bold text-base-content">
						Class Details
					</h2>
					<ClassStatusBadge status={classDetails.status} />
				</div>

				{/* Main Content */}
				<div className="space-y-6 text-base-content">
					{/* Student and Teacher Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<UserCard user={classDetails.student} />
						<UserCard user={classDetails.teacher} />
					</div>

					{/* Class Details */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="flex flex-col space-y-2">
							<strong>Subject:</strong>
							<span className="text-base-content">
								{classDetails.subject}
							</span>
						</div>
						<div className="flex flex-col space-y-2">
							<strong>Start Time:</strong>
							<span className="text-base-content">
								{classDetails.startTime}
							</span>
						</div>
						<div className="flex flex-col space-y-2">
							<strong>Duration:</strong>
							<span className="text-base-content">
								{decimalStringToHours(
									classDetails.durationInHours
								)}
							</span>
						</div>
						<div className="flex flex-col space-y-2">
							<strong>Total Price:</strong>
							<span className="text-base-content">
								{classDetails.totalPrice} €
							</span>
						</div>
						<div className="flex flex-col space-y-2">
							<strong>Payment Status:</strong>
							<span
								className={`font-semibold ${
									classDetails.paid
										? "text-success"
										: "text-error"
								}`}
							>
								{classDetails.paid ? "Paid" : "Unpaid"}
							</span>
						</div>
						<div className="flex flex-col space-y-2">
							<strong>Created At:</strong>
							<span className="text-base-content">
								{classDetails.createdAt}
							</span>
						</div>
					</div>
				</div>

				{/* Pay Now Button (Conditional Rendering) */}
				{!classDetails.paid && classDetails.status === "scheduled" && (
					<div className="mt-6 flex justify-end">
						<Link
							href={`/main/classes/${classDetails.id}/pay`}
							className="btn btn-success"
						>
							Pay Now{" "}
							<i className="fa-solid fa-money-bill-wave"></i>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

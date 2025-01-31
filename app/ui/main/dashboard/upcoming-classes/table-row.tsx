//TODO: use this as a client component to allow the user to select the class and view its details, maybe in a modal

"use client";

import decimalToHours from "@/utils/decimal-to-time";
import { $Enums } from "@prisma/client";

export default function UpcomingClassesTableRow(props: {
	classData: {
		teacher: {
			user: {
				id: string;
				createdAt: Date;
				updatedAt: Date;
				firstName: string;
				lastName: string;
				email: string;
				emailVerified: Date | null;
				password: string;
				image: string | null;
				phoneNumber: string | null;
				role: $Enums.Role;
				bio: string | null;
			};
		};
		subject: {
			id: string;
			name: string;
		};
		startTime: Date;
		durationInHours: number;
		totalPrice: { toString: () => string };
		status: $Enums.Status;
	};
}) {
	return (
		<tr className="hover:bg-base-200 transition-all">
			<td className="whitespace-nowrap px-4 py-2 font-medium text-base-content capitalize">
				{props.classData.subject.name}
			</td>
			<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
				{props.classData.teacher.user.firstName +
					" " +
					props.classData.teacher.user.lastName}
			</td>
			<td className="whitespace-nowrap px-4 py-2 text-base-content">
				{props.classData.startTime.toUTCString()}
			</td>
			<td className="whitespace-nowrap px-4 py-2 text-base-content">
				{decimalToHours(props.classData.durationInHours)}
			</td>
			<td className="whitespace-nowrap px-4 py-2 text-base-content">
				{props.classData.totalPrice.toString() + "€"}
			</td>
			<td className="whitespace-nowrap px-4 py-2 text-base-content capitalize">
				{props.classData.status}
			</td>
		</tr>
	);
}

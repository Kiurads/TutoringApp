"use client";

import { fetchTeacherById } from "@/app/lib/actions/teachers.actions";
import UserDetails from "@/app/lib/types/user.types";
import GoBackButton from "@/app/ui/go-back-button";
import DeleteTeacherButton from "@/app/ui/main/teachers/delete-button";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeleteTeacherPage() {
	const { id } = useParams();

	const [teacherDetails, setTeacherDetails] = useState<UserDetails | null>(
		null
	);

	useEffect(() => {
		async function fetchTeacherDetails() {
			if (typeof id === "string") {
				setTeacherDetails(await fetchTeacherById(id));
			}
		}

		if (id) fetchTeacherDetails();
	}, [id]);

	if (!id || typeof id !== "string") {
		return <h1>Invalid class ID</h1>;
	}

	return (
		<div className="max-w-md mx-auto bg-base-100 p-6 rounded-lg shadow-lg mt-10">
			<h2 className="text-lg font-bold text-center">Confirm Deletion</h2>
			{teacherDetails && (
				<p className="text-center mt-2">
					Are you sure you want to delete{" "}
					<strong>{teacherDetails.name}</strong>?
				</p>
			)}
			<div className="col-span-6 mt-4 sm:flex sm:items-center sm:gap-4">
				<DeleteTeacherButton id={id} />
				<GoBackButton url="/main/admin/teachers" />
			</div>
		</div>
	);
}

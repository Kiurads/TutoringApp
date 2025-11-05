"use client";

import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { ClassData } from "@/app/lib/types/classes.types";
import GoBackButton from "@/app/ui/go-back-button";
import CancelButton from "@/app/ui/main/classes/cancel/cancel-button";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CancelBookingPage() {
	const { id } = useParams();

	const [classData, setClassData] = useState<ClassData | null>(null);

	useEffect(() => {
		async function fetchClassDetails() {
			if (typeof id === "string") {
				setClassData(await fetchClassById(id));
			}
		}

		if (id) fetchClassDetails();
	}, [id]);

	if (!id || typeof id !== "string") {
		return <h1>Invalid class ID</h1>;
	}

	return (
		<div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mt-10">
			<h2 className="text-lg font-bold text-center">
				Confirm Cancellation
			</h2>
			{classData && (
				<p className="text-center mt-2">
					Are you sure you want to cancel{" "}
					<strong>{classData.subject}</strong> class with{" "}
					<strong>{classData.teacher.name}</strong>?
				</p>
			)}
			<div className="col-span-6 mt-4 sm:flex sm:items-center sm:gap-4">
				<CancelButton id={id} />
				<GoBackButton url="/main/classes" />
			</div>
		</div>
	);
}

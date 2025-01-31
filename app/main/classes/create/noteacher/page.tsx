"use client";

import { getSubjects } from "@/app/lib/subjects/get-subjects";
import { Subject } from "@prisma/client";
import { useEffect, useState } from "react";

export default function CreateClassNoTeacherPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);

	useEffect(() => {
		getSubjects().then((fetchedSubjects) => {
			setSubjects(fetchedSubjects); // Update state with fetched data
		});
	}, []);

	return (
		<div>
			<h1>Subjects List</h1>
			<ul>
				{subjects.map((subject) => (
					<li key={subject.id}>
						<strong>ID:</strong> {subject.id},{" "}
						<strong>Name:</strong> {subject.name}
					</li>
				))}
			</ul>
		</div>
	);
}

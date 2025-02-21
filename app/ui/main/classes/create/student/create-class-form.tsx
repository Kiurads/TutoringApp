"use client";

// External
import Link from "next/link";
import { useState, useEffect } from "react";
import { useActionState } from "react";

// Server actions
import { Subject } from "@prisma/client";
import { createClassAsStudent } from "@/app/lib/classes/create-class-as-student";
import { fetchTeachersBySubjectsId } from "@/app/lib/actions/teachers.actions";
import { fetchSubjectsWithTeachers } from "@/app/lib/actions/subjects.actions";

// UI elements
import SubjectSelect from "./subject-select";
import StartTimeInput from "./start-time-input";
import DurationSelect from "./duration-select";
import TeacherSelect from "./teacher-select";
import GoBackButton from "@/app/ui/go-back-button";

export default function RequestClassForm() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [teachers, setTeachers] = useState<
		{ id: string; firstName: string; lastName: string }[]
	>([]);
	const [selectedSubject, setSelectedSubject] = useState("");
	const [errorMessage, formAction, isPending] = useActionState(
		createClassAsStudent,
		undefined
	);

	useEffect(() => {
		async function updateSubjects() {
			const subjects = await fetchSubjectsWithTeachers();
			setSubjects(subjects);
		}
		updateSubjects();
	}, []);

	useEffect(() => {
		if (!selectedSubject) return;

		async function updateTeachers() {
			const teachers = await fetchTeachersBySubjectsId([selectedSubject]);
			setTeachers(teachers);
		}
		updateTeachers();
	}, [selectedSubject]);

	const durations = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25); // 0.25 to 2 hours in 15-minute increments

	const minStartDate = new Date(new Date().setDate(new Date().getDate() + 1))
		.toISOString()
		.slice(0, 16);

	return (
		<form action={formAction} className="card-body">
			{errorMessage && (
				<div role="alert" className="alert alert-error">
					<span>{errorMessage}</span>
				</div>
			)}

			<SubjectSelect
				subjects={subjects}
				selectedSubject={selectedSubject}
				onSelectSubject={setSelectedSubject}
			/>

			<StartTimeInput minDate={minStartDate} />

			<DurationSelect durations={durations} />

			<TeacherSelect
				teachers={teachers}
				selectedSubject={selectedSubject}
			/>

			<div className="col-span-6 mt-4 sm:flex sm:items-center sm:gap-4">
				<button
					className="btn btn-primary flex-grow"
					aria-disabled={isPending}
				>
					Create Class
				</button>

				<div>
					<GoBackButton url="/main/classes" />
				</div>
			</div>
		</form>
	);
}

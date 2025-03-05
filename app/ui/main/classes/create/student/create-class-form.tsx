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
		<div className="max-w-xl mx-auto p-6 bg-base-100 shadow-lg rounded-xl border border-base-300">
			<h2 className="text-xl font-semibold text-center mb-4">
				Request a New Class
			</h2>

			<form action={formAction} className="grid gap-4">
				{/* Error Alert */}
				{errorMessage && (
					<div role="alert" className="alert alert-error text-sm">
						<i className="fa-solid fa-triangle-exclamation mr-2"></i>
						<span>{errorMessage}</span>
					</div>
				)}

				{/* Form Fields */}
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

				{/* Buttons */}
				<div className="flex items-center gap-4 mt-4">
					<button
						className="btn btn-primary flex-grow"
						aria-disabled={isPending}
					>
						{isPending ? (
							<>
								<i className="fa-solid fa-spinner animate-spin"></i>
								Creating...
							</>
						) : (
							<>
								<i className="fa-solid fa-calendar-plus"></i>
								Create Class
							</>
						)}
					</button>

					<GoBackButton url="/main/classes" />
				</div>
			</form>
		</div>
	);
}

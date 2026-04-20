"use client";

// External
import { useState, useEffect } from "react";
import { useActionState } from "react";

// Server actions
import { Subject } from "@prisma/client";
import { createClassAsTeacher } from "@/app/lib/classes/create-class-as-teacher";
import { fetchSubjectsWithTeachers } from "@/app/lib/actions/subjects.actions";

// UI elements
import SubjectSelect from "./subject-select";
import StartTimeInput from "./start-time-input";
import DurationSelect from "./duration-select";
import StudentSelect from "./student-select";
import GoBackButton from "@/app/ui/go-back-button";
import { fetchStudents } from "@/app/lib/actions/students.actions";
import UserDetails from "@/app/lib/types/user.types";

export default function CreateClassForm({
	initialStartTime,
	initialDuration,
}: {
	initialStartTime?: string;
	initialDuration?: number;
} = {}) {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [students, setStudents] = useState<UserDetails[]>([]);
	const [selectedSubject, setSelectedSubject] = useState("");
	const [errorMessage, formAction, isPending] = useActionState(
		createClassAsTeacher,
		undefined,
	);

	useEffect(() => {
		async function updateSubjects() {
			const subjects = await fetchSubjectsWithTeachers();
			setSubjects(subjects);
		}
		async function updateStudents() {
			const students = await fetchStudents();
			console.log("Students received in component:", students);
			setStudents(students);
		}
		updateStudents();
		updateSubjects();
	}, []);

	const durations = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25); // 0.25 to 2 hours in 15-minute increments

	const minStartDate = new Date(new Date().setDate(new Date().getDate() + 1))
		.toISOString()
		.slice(0, 16);

	return (
		<div className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300">
			<h2 className="text-xl font-semibold text-center mb-4">
				Create a New Class
			</h2>

			<form action={formAction} className="flex flex-col gap-5">
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

				<StartTimeInput minDate={minStartDate} defaultValue={initialStartTime} />

				<DurationSelect durations={durations} defaultValue={initialDuration} />

				<StudentSelect students={students} />

				{/* Buttons */}
				<div className="flex items-center gap-4 mt-2">
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

					<GoBackButton url="/main/teacher/classes" />
				</div>
			</form>
		</div>
	);
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { requestRegularClass } from "@/app/lib/actions/regular-classes.actions";
import { fetchSubjectsWithTeachers } from "@/app/lib/actions/subjects.actions";
import { fetchTeachersBySubjectsId } from "@/app/lib/actions/teachers.actions";
import type { TeacherDetails } from "@/app/lib/types/teachers.types";
import SubjectSelect from "@/app/ui/main/classes/create/student/subject-select";
import TeacherSelect from "@/app/ui/main/classes/create/student/teacher-select";
import DurationSelect from "@/app/ui/main/classes/create/student/duration-select";
import DayOfWeekSelect from "./day-of-week-select";
import GoBackButton from "@/app/ui/go-back-button";

const DURATIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25);

export default function RequestRegularClassForm() {
	const [state, formAction, isPending] = useActionState(requestRegularClass, undefined);

	const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [teachers, setTeachers] = useState<TeacherDetails[]>([]);
	const [selectedTeacherId, setSelectedTeacherId] = useState("");

	useEffect(() => {
		fetchSubjectsWithTeachers().then(setSubjects);
	}, []);

	useEffect(() => {
		if (!selectedSubject) {
			setTeachers([]);
			return;
		}
		setSelectedTeacherId("");
		fetchTeachersBySubjectsId([selectedSubject]).then(setTeachers);
	}, [selectedSubject]);

	return (
		<form
			action={formAction}
			className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300 flex flex-col gap-5"
		>
			<h2 className="text-xl font-semibold text-center">Request a Recurring Class</h2>
			<p className="text-sm text-base-content/60 text-center -mt-3">
				Pick a weekly slot. The teacher reviews it once — if accepted, sessions repeat
				automatically every week.
			</p>

			{state && (
				<div role="alert" className="alert alert-error text-sm">
					<i className="fa-solid fa-triangle-exclamation shrink-0" />
					<span>{state}</span>
				</div>
			)}

			<SubjectSelect
				subjects={subjects}
				selectedSubject={selectedSubject}
				onSelectSubject={setSelectedSubject}
			/>

			<DayOfWeekSelect selectedDay={selectedDay} onSelectDay={setSelectedDay} />

			<div className="flex flex-col gap-1.5">
				<label htmlFor="Time" className="text-sm font-medium">Time</label>
				<input
					type="time"
					id="Time"
					name="time"
					required
					className="input input-bordered w-full"
				/>
			</div>

			{selectedSubject && (
				<TeacherSelect
					teachers={teachers}
					selectedSubject={selectedSubject}
					selectedTeacherId={selectedTeacherId}
					onSelectTeacher={(id) => setSelectedTeacherId(id)}
				/>
			)}

			<DurationSelect durations={DURATIONS} />

			<div className="flex items-center gap-4 mt-2">
				<button type="submit" className="btn btn-primary flex-grow gap-2" disabled={isPending}>
					{isPending ? (
						<span className="loading loading-spinner loading-sm" />
					) : (
						<>
							<i className="fa-solid fa-arrow-right" />
							Send Request
						</>
					)}
				</button>
				<GoBackButton url="/main/student/regular-classes" />
			</div>
		</form>
	);
}

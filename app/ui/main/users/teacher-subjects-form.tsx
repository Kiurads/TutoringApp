"use client";

import { useState, useTransition } from "react";
import { updateTeacherSubjects } from "@/app/lib/actions/teachers/update-teacher-subjects";
import { SubjectData } from "@/app/lib/types/subjects.types";

export default function TeacherSubjectsForm({
	allSubjects,
	initialSubjectIds,
}: {
	allSubjects: SubjectData[];
	initialSubjectIds: string[];
}) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [selected, setSelected] = useState<string[]>(initialSubjectIds);

	function toggleSubject(id: string) {
		setSuccess(false);
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
		);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		startTransition(async () => {
			const result = await updateTeacherSubjects(selected);
			if (result.error) {
				setError(result.error);
			} else {
				setSuccess(true);
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2">
				{allSubjects.map((subject) => {
					const isSelected = selected.includes(subject.id);
					return (
						<label
							key={subject.id}
							className={`btn btn-sm rounded-full ${
								isSelected ? "btn-primary" : "btn-ghost border border-base-300"
							}`}
						>
							<input
								type="checkbox"
								className="hidden"
								checked={isSelected}
								onChange={() => toggleSubject(subject.id)}
							/>
							{subject.name}
						</label>
					);
				})}
			</div>

			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-circle-xmark"></i>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div role="alert" className="alert alert-success text-sm py-2">
					<i className="fa-solid fa-circle-check"></i>
					<span>Subjects updated successfully.</span>
				</div>
			)}

			<button
				type="submit"
				className="btn btn-primary self-start"
				disabled={isPending}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-sm"></span>
				) : (
					<>
						<i className="fa-solid fa-floppy-disk"></i> Save subjects
					</>
				)}
			</button>
		</form>
	);
}

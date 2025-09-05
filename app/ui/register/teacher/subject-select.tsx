"use client";

import { SubjectData } from "@/app/lib/types/subjects.types";
import { useState } from "react";

export default function SubjectSelect({
	subjects,
}: {
	subjects: SubjectData[];
}) {
	const [selected, setSelected] = useState<string[]>([]);

	const toggleSubject = (id: string, name: string) => {
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
		);
	};

	return (
		<div className="form-control">
			<label className="label">
				<span className="label-text">Subjects</span>
			</label>
			<div className="dropdown w-full">
				<label
					tabIndex={0}
					className="btn btn-outline w-full justify-between"
				>
					{selected.length > 0 ? (
						<span className="truncate">
							{subjects
								.filter((s) => selected.includes(s.id))
								.map((s) => s.name)
								.join(", ")}
						</span>
					) : (
						<span className="text-gray-400">Select subjects</span>
					)}
					<svg
						className="w-4 h-4 ml-2 opacity-60"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</label>
				<ul
					tabIndex={0}
					className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-64 max-h-60 overflow-y-auto"
				>
					{subjects.map((subject) => (
						<li key={subject.id}>
							<label className="label cursor-pointer justify-start gap-2">
								<input
									type="checkbox"
									name="subjects"
									value={subject.id}
									checked={selected.includes(subject.id)}
									onChange={() =>
										toggleSubject(subject.id, subject.name)
									}
									className="checkbox checkbox-sm"
								/>
								<span>{subject.name}</span>
							</label>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

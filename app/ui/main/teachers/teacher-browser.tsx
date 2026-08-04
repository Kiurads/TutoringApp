"use client";

import { useState } from "react";
import { TeacherExtended } from "@/app/lib/types/teachers.types";
import { SortOption, SORT_LABELS, sortTeachers } from "@/app/lib/teachers/sort-teachers";
import TeacherCard from "./teacher-card";

export default function TeacherBrowser({
	teachers,
	subjects,
	hasHistory,
	initialSubject = null,
}: {
	teachers: TeacherExtended[];
	subjects: string[];
	hasHistory: boolean;
	initialSubject?: string | null;
}) {
	const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject);
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("default");

	const bySubject =
		activeSubject === null
			? teachers
			: teachers.filter((t) => t.subjects.includes(activeSubject));

	const bySearch = search.trim()
		? bySubject.filter((t) =>
				t.name.toLowerCase().includes(search.trim().toLowerCase()),
			)
		: bySubject;

	const filtered = sortTeachers(bySearch, sortBy);

	const onlineCount = filtered.filter((t) => t.isOnline).length;
	const topMatches = filtered.filter((t) => (t.fitScore ?? 0) > 0).length;

	return (
		<div>
			{/* Search + sort */}
			<div className="flex flex-col sm:flex-row gap-3 mb-4">
				<input
					type="text"
					placeholder="Search teachers by name"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="input input-bordered w-full sm:max-w-xs"
				/>
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value as SortOption)}
					className="select select-bordered w-full sm:w-auto"
					aria-label="Sort teachers"
				>
					{(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
						<option key={option} value={option}>
							Sort: {SORT_LABELS[option]}
						</option>
					))}
				</select>
			</div>

			{/* Subject filter chips */}
			<div className="flex gap-2 flex-wrap mb-6">
				<button
					onClick={() => setActiveSubject(null)}
					className={`btn btn-sm rounded-full ${
						activeSubject === null
							? "btn-primary"
							: "btn-ghost border border-base-300"
					}`}
				>
					All
				</button>
				{subjects.map((subject) => (
					<button
						key={subject}
						onClick={() =>
							setActiveSubject(activeSubject === subject ? null : subject)
						}
						className={`btn btn-sm rounded-full ${
							activeSubject === subject
								? "btn-primary"
								: "btn-ghost border border-base-300"
						}`}
					>
						{subject}
					</button>
				))}
			</div>

			{/* Results summary */}
			<p className="text-sm text-base-content/60 mb-4">
				{filtered.length} teacher{filtered.length !== 1 ? "s" : ""}
				{activeSubject ? ` for ${activeSubject}` : ""}
				{onlineCount > 0 && (
					<span className="text-success ml-2">
						· {onlineCount} available now
					</span>
				)}
				{hasHistory && topMatches > 0 && (
					<span className="text-primary ml-2">
						· {topMatches} match{topMatches !== 1 ? "es" : ""} found
					</span>
				)}
			</p>

			{/* Teacher grid */}
			{filtered.length === 0 ? (
				<div className="text-center py-16 text-base-content/50">
					<p className="text-lg font-medium">No teachers found</p>
					<p className="text-sm mt-1">
						{search.trim()
							? "Try a different name or clear the search"
							: "Try a different subject filter"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
					{filtered.map((teacher) => (
						<TeacherCard key={teacher.id} teacher={teacher} showFitScore={hasHistory} />
					))}
				</div>
			)}
		</div>
	);
}

// app/main/admin/teachers/TeachersTable.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { TeacherExtended } from "@/app/lib/types/teachers.types";

export default function TeachersTable(props: {
	initialTeachers: TeacherExtended[];
}) {
	const { initialTeachers } = props;
	const [search, setSearch] = useState("");

	const filteredTeachers = initialTeachers.filter(
		(t) =>
			t.name.toLowerCase().includes(search.toLowerCase()) ||
			t.email.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Teachers</h1>
			</div>

			{/* Search Bar */}
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search by name or email"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="input input-bordered w-full md:w-1/3"
				/>
				<Link
					href="/main/admin/teachers/create"
					className="btn btn-primary m-4"
				>
					+ Add Teacher
				</Link>
			</div>

			{/* Teachers Table */}
			<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Subjects</th>
							<th>Status</th>
							<th>Payouts</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{filteredTeachers.map((teacher) => (
							<tr key={teacher.id}>
								<td>{teacher.name}</td>
								<td>{teacher.email}</td>
								<td>
									{teacher.subjects.map((subj, i) => (
										<span
											key={i}
											className="badge badge-outline mr-1"
										>
											{subj}
										</span>
									))}
								</td>
								<td>
									<span
										className={`badge ${
											teacher.status === "Active"
												? "badge-success"
												: "badge-warning"
										}`}
									>
										{teacher.status}
									</span>
								</td>
								<td>
									<span
										className={`badge ${
											teacher.connectStatus === "active"
												? "badge-success"
												: teacher.connectStatus === "restricted"
													? "badge-error"
													: teacher.connectStatus === "pending"
														? "badge-warning"
														: "badge-ghost"
										}`}
									>
										{teacher.connectStatus === "not_started"
											? "Not set up"
											: teacher.connectStatus}
									</span>
								</td>
								<td>
									<div className="flex gap-2">
										<Link
											href={`/main/admin/teachers/${teacher.id}`}
											className="btn btn-sm"
										>
											View
										</Link>
										<Link
											href={`/main/admin/teachers/${teacher.id}/delete`}
											className="btn btn-sm btn-error"
										>
											Delete
										</Link>
									</div>
								</td>
							</tr>
						))}

						{filteredTeachers.length === 0 && (
							<tr>
								<td
									colSpan={6}
									className="text-center py-6 text-base-content/50"
								>
									No teachers found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

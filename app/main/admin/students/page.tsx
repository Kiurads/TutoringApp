"use client";

import { useState } from "react";

export default function StudentsPage() {
	const [search, setSearch] = useState("");
	const students = [
		{
			id: 1,
			name: "Ana Lopes",
			email: "ana@school.com",
			bookings: 5,
			status: "Active",
		},
		{
			id: 2,
			name: "Rui Santos",
			email: "rui@school.com",
			bookings: 0,
			status: "Inactive",
		},
	];

	const filtered = students.filter(
		(s) =>
			s.name.toLowerCase().includes(search.toLowerCase()) ||
			s.email.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Students</h1>

			<input
				type="text"
				placeholder="Search students..."
				className="input input-bordered w-full md:w-1/3 mb-4"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<div className="overflow-x-auto bg-base-200 rounded-lg shadow">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Bookings</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((student) => (
							<tr key={student.id}>
								<td>{student.name}</td>
								<td>{student.email}</td>
								<td>{student.bookings}</td>
								<td>
									<span
										className={`badge ${
											student.status === "Active"
												? "badge-success"
												: "badge-error"
										}`}
									>
										{student.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

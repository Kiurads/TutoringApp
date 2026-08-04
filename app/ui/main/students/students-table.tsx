"use client";

import { useState } from "react";
import Image from "next/image";
import getAvatar from "@/utils/get-avatar";

interface Student {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	avatarOptions: string | null;
	createdAt: Date;
	_count: { classesAsStudent: number };
}

export default function StudentsTable({ initialStudents }: { initialStudents: Student[] }) {
	const [search, setSearch] = useState("");

	const filteredStudents = initialStudents.filter(
		(s) =>
			`${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
			s.email.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div>
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search by name or email"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="input input-bordered w-full md:w-1/3"
				/>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					{filteredStudents.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-12">
							{search ? "No students match your search." : "No students registered yet."}
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>Student</th>
										<th>Email</th>
										<th>Classes</th>
										<th>Joined</th>
									</tr>
								</thead>
								<tbody>
									{filteredStudents.map((s) => (
										<tr key={s.id} className="hover">
											<td>
												<div className="flex items-center gap-3">
													<Image
														src={getAvatar(s.email, s.avatarOptions)} unoptimized
														alt=""
														width={32}
														height={32}
														className="size-8 rounded-full"
													/>
													<span className="font-medium capitalize">
														{s.firstName} {s.lastName}
													</span>
												</div>
											</td>
											<td className="text-sm text-base-content/60">{s.email}</td>
											<td>
												<span className="badge badge-ghost badge-sm">
													{s._count.classesAsStudent}
												</span>
											</td>
											<td className="text-xs text-base-content/50 whitespace-nowrap">
												{new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

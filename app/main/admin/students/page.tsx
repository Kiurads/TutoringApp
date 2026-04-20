import prisma from "@/prisma";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";

async function getStudents() {
	return prisma.user.findMany({
		where: { role: "student" },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			createdAt: true,
			_count: { select: { classesAsStudent: true } },
		},
	});
}

export default async function StudentsPage() {
	const students = await getStudents();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Students</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{students.length} registered student{students.length !== 1 ? "s" : ""}
				</p>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					{students.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-12">No students registered yet.</p>
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
									{students.map((s) => (
										<tr key={s.id} className="hover">
											<td>
												<div className="flex items-center gap-3">
													<Image
														src={getAvatar(s.email)} unoptimized
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

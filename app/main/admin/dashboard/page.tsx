import prisma from "@/prisma";
import Link from "next/link";

async function getStats() {
	const [studentCount, teacherCount, classCount, revenueResult, recentClasses] =
		await Promise.all([
			prisma.user.count({ where: { role: "student" } }),
			prisma.user.count({ where: { role: "teacher" } }),
			prisma.class.count(),
			prisma.payment.aggregate({ _sum: { amount: true } }),
			prisma.class.findMany({
				take: 8,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					status: true,
					startTime: true,
					student: { select: { firstName: true, lastName: true } },
					teacher: { select: { firstName: true, lastName: true } },
					subject: { select: { name: true } },
				},
			}),
		]);

	return {
		studentCount,
		teacherCount,
		classCount,
		totalRevenue: revenueResult._sum.amount?.toNumber() ?? 0,
		recentClasses,
	};
}

const STATUS_BADGE: Record<string, string> = {
	completed: "badge-success",
	scheduled: "badge-info",
	requested: "badge-warning",
	refused:   "badge-error",
};

export default async function AdminDashboard() {
	const { studentCount, teacherCount, classCount, totalRevenue, recentClasses } =
		await getStats();

	const stats = [
		{ label: "Students",  value: studentCount,                       icon: "fa-user-graduate",     color: "text-primary"   },
		{ label: "Teachers",  value: teacherCount,                       icon: "fa-chalkboard-user",   color: "text-secondary" },
		{ label: "Classes",   value: classCount,                         icon: "fa-school",            color: "text-accent"    },
		{ label: "Revenue",   value: `€${totalRevenue.toFixed(2)}`,      icon: "fa-euro-sign",         color: "text-success"   },
	];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-base-content/60 mt-1 text-sm">Platform overview at a glance.</p>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
				{stats.map((s) => (
					<div key={s.label} className="stat shadow rounded-xl bg-base-200">
						<div className={`stat-figure ${s.color}`}>
							<i className={`fa-solid ${s.icon} text-3xl`}></i>
						</div>
						<div className="stat-title">{s.label}</div>
						<div className={`stat-value text-2xl ${s.color}`}>{s.value}</div>
					</div>
				))}
			</div>

			{/* Recent classes */}
			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					<div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
						<h2 className="font-semibold text-base">Recent Classes</h2>
						<Link href="/main/admin/classes" className="text-xs text-primary hover:underline">
							View all
						</Link>
					</div>
					{recentClasses.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-10">No classes yet.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="table table-sm">
								<thead>
									<tr>
										<th>Student</th>
										<th>Teacher</th>
										<th>Subject</th>
										<th>Date</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{recentClasses.map((c) => (
										<tr key={c.id} className="hover">
											<td className="capitalize">{c.student.firstName} {c.student.lastName}</td>
											<td className="capitalize">
												{c.teacher
													? `${c.teacher.firstName} ${c.teacher.lastName}`
													: <span className="text-base-content/40 text-xs">Unassigned</span>}
											</td>
											<td className="capitalize">{c.subject.name}</td>
											<td className="text-xs whitespace-nowrap">
												{new Date(c.startTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
											</td>
											<td>
												<span className={`badge badge-sm badge-outline capitalize ${STATUS_BADGE[c.status] ?? "badge-ghost"}`}>
													{c.status}
												</span>
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

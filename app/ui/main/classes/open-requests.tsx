"use client";

import { OpenRequest, claimClass } from "@/app/lib/actions/classes.actions";
import { useTransition } from "react";

function ClaimButton({ classId }: { classId: string }) {
	const [isPending, startTransition] = useTransition();

	return (
		<button
			className="btn btn-success btn-sm gap-1"
			disabled={isPending}
			onClick={() => startTransition(async () => { await claimClass(classId); })}
		>
			{isPending ? (
				<span className="loading loading-spinner loading-xs" />
			) : (
				<i className="fa-solid fa-hand-pointer"></i>
			)}
			{isPending ? "Claiming…" : "Claim"}
		</button>
	);
}

export default function OpenRequests({ requests }: { requests: OpenRequest[] }) {
	if (requests.length === 0) return null;

	return (
		<div className="rounded-lg border border-warning/50 bg-warning/5 mb-6">
			<div className="flex items-center gap-2 px-4 py-3 border-b border-warning/30">
				<i className="fa-solid fa-bolt text-warning"></i>
				<h2 className="text-base font-semibold text-warning">Open Requests</h2>
				<span className="badge badge-warning badge-sm ml-1">{requests.length}</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full divide-y divide-base-300 text-sm">
					<thead>
						<tr className="bg-base-200/60">
							<th className="px-4 py-2 font-medium text-base-content text-left">Subject</th>
							<th className="px-4 py-2 font-medium text-base-content text-left">Student</th>
							<th className="px-4 py-2 font-medium text-base-content text-left">When</th>
							<th className="px-4 py-2 font-medium text-base-content text-left">Duration</th>
							<th className="px-4 py-2 font-medium text-base-content text-left">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-base-300">
						{requests.map((r) => (
							<tr key={r.id} className="hover:bg-base-200/60 transition-colors">
								<td className="px-4 py-2 font-semibold capitalize">{r.subject}</td>
								<td className="px-4 py-2 capitalize">{r.studentName}</td>
								<td className="px-4 py-2 text-xs whitespace-nowrap">
									<span className="block">
										{new Date(r.startTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
									</span>
									<span className="text-base-content/50">
										{new Date(r.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
									</span>
								</td>
								<td className="px-4 py-2">{r.durationInHours}h</td>
								<td className="px-4 py-2">
									<ClaimButton classId={r.id} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

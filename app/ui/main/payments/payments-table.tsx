"use client";

import { useState } from "react";
import RetryPayoutButton from "@/app/ui/main/payments/retry-payout-button";

const PAYOUT_STATUS_BADGE: Record<string, string> = {
	transferred: "badge-success",
	pending: "badge-warning",
	failed: "badge-error",
	not_applicable: "badge-ghost",
};

const PAYOUT_STATUS_LABEL: Record<string, string> = {
	transferred: "Paid out",
	pending: "Pending",
	failed: "Failed",
	not_applicable: "—",
};

interface Payment {
	id: string;
	classId: string;
	amount: number;
	platformFeeAmount: number | null;
	teacherPayoutAmount: number | null;
	payoutStatus: string;
	payoutError: string | null;
	createdAt: Date;
	student: { firstName: string; lastName: string };
	teacher: { firstName: string; lastName: string };
	class: { subject: { name: string } };
}

export default function PaymentsTable({ initialPayments }: { initialPayments: Payment[] }) {
	const [search, setSearch] = useState("");

	const filteredPayments = initialPayments.filter((p) => {
		const needle = search.toLowerCase();
		return (
			`${p.student.firstName} ${p.student.lastName}`.toLowerCase().includes(needle) ||
			`${p.teacher.firstName} ${p.teacher.lastName}`.toLowerCase().includes(needle) ||
			p.class.subject.name.toLowerCase().includes(needle) ||
			p.id.toLowerCase().includes(needle)
		);
	});

	return (
		<div>
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search by student, teacher, subject, or transaction ID"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="input input-bordered w-full md:w-1/3"
				/>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body p-0">
					{filteredPayments.length === 0 ? (
						<p className="text-center text-base-content/40 text-sm py-12">
							{search ? "No payments match your search." : "No payments recorded yet."}
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>Student</th>
										<th>Teacher</th>
										<th>Subject</th>
										<th>Amount</th>
										<th>Payout</th>
										<th>Date</th>
										<th>ID</th>
									</tr>
								</thead>
								<tbody>
									{filteredPayments.map((p) => (
										<tr key={p.id} className="hover">
											<td className="capitalize">{p.student.firstName} {p.student.lastName}</td>
											<td className="capitalize">{p.teacher.firstName} {p.teacher.lastName}</td>
											<td className="capitalize text-sm">{p.class.subject.name}</td>
											<td className="font-semibold text-success">€{p.amount.toFixed(2)}</td>
											<td>
												<span className={`badge badge-sm ${PAYOUT_STATUS_BADGE[p.payoutStatus]}`}>
													{PAYOUT_STATUS_LABEL[p.payoutStatus]}
												</span>
												{p.payoutStatus === "failed" && (
													<div className="flex flex-col gap-1 mt-1 max-w-xs">
														{p.payoutError && (
															<p className="text-xs text-error/70">{p.payoutError}</p>
														)}
														<RetryPayoutButton paymentId={p.id} />
													</div>
												)}
											</td>
											<td className="text-xs text-base-content/50 whitespace-nowrap">
												{new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
											</td>
											<td className="font-mono text-xs text-base-content/40">{p.id.slice(0, 8)}…</td>
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

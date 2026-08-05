import type { PaymentReceipt } from "@/app/lib/actions/paymets.actions";

function formatDate(d: Date): string {
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function formatDateTime(d: Date): string {
	return d.toLocaleString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function Receipt({ receipt }: { receipt: PaymentReceipt }) {
	return (
		<div className="max-w-2xl mx-auto bg-base-100 border border-base-300 rounded-lg p-8 print:border-none print:p-0 print:max-w-none">
			<div className="flex items-start justify-between border-b border-base-300 pb-6 mb-6">
				<div>
					<div className="flex items-center gap-2 text-xl font-bold">
						<i className="fa-solid fa-graduation-cap text-primary" />
						<span>Ponte</span>
					</div>
					<p className="text-sm text-base-content/60 mt-1">Payment Receipt</p>
				</div>
				<div className="text-right text-sm">
					<p className="text-base-content/60">Receipt #</p>
					<p className="font-mono">{receipt.id}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6 mb-6 text-sm">
				<div>
					<p className="text-base-content/50 font-medium uppercase text-xs tracking-wide mb-1">
						Student
					</p>
					<p className="font-medium">{receipt.student.name}</p>
					<p className="text-base-content/60">{receipt.student.email}</p>
				</div>
				<div>
					<p className="text-base-content/50 font-medium uppercase text-xs tracking-wide mb-1">
						Teacher
					</p>
					<p className="font-medium">{receipt.teacher.name}</p>
					<p className="text-base-content/60">{receipt.teacher.email}</p>
				</div>
			</div>

			<div className="mb-6 text-sm">
				<p className="text-base-content/50 font-medium uppercase text-xs tracking-wide mb-1">
					Class
				</p>
				<p className="font-medium">{receipt.subjectName}</p>
				<p className="text-base-content/60">
					{formatDateTime(receipt.classStartTime)} · {receipt.durationInHours}h
				</p>
			</div>

			<div className="mb-6 text-sm">
				<p className="text-base-content/50 font-medium uppercase text-xs tracking-wide mb-1">
					Payment date
				</p>
				<p>{formatDate(receipt.createdAt)}</p>
			</div>

			<table className="w-full text-sm border-t border-base-300 pt-2">
				<tbody>
					<tr>
						<td className="py-2 text-base-content/70">Amount paid</td>
						<td className="py-2 text-right font-medium">{receipt.amount.toFixed(2)}€</td>
					</tr>
					<tr>
						<td className="py-2 text-base-content/70">Platform fee</td>
						<td className="py-2 text-right text-base-content/70">
							−{receipt.platformFeeAmount.toFixed(2)}€
						</td>
					</tr>
					<tr className="border-t border-base-300">
						<td className="py-2 font-semibold">Teacher payout</td>
						<td className="py-2 text-right font-semibold">
							{receipt.teacherPayoutAmount.toFixed(2)}€
						</td>
					</tr>
				</tbody>
			</table>

			<div className="mt-6 pt-4 border-t border-base-300 text-xs text-base-content/50">
				<p>Stripe transaction reference: {receipt.intentId}</p>
				<p className="mt-1">This receipt was generated automatically and does not require a signature.</p>
			</div>
		</div>
	);
}

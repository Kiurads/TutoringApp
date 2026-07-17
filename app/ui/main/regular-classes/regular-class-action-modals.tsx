"use client";

import { useState, useTransition } from "react";
import {
	acceptRegularClass,
	refuseRegularClass,
	cancelRegularClass,
} from "@/app/lib/actions/regular-classes.actions";

type ModalType = "accept" | "refuse" | "cancel";

interface Props {
	id: string;
	subject: string;
	otherPartyName: string;
	canAccept: boolean;
	canRefuse: boolean;
	canCancel: boolean;
}

export default function RegularClassActionModals({
	id,
	subject,
	otherPartyName,
	canAccept,
	canRefuse,
	canCancel,
}: Props) {
	const [open, setOpen] = useState<ModalType | null>(null);
	const [isPending, startTransition] = useTransition();

	function confirmAccept() {
		startTransition(async () => {
			await acceptRegularClass(id);
		});
	}
	function confirmRefuse() {
		startTransition(async () => {
			await refuseRegularClass(id);
		});
	}
	function confirmCancel() {
		startTransition(async () => {
			await cancelRegularClass(id);
		});
	}

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{canAccept && (
					<button className="btn btn-success btn-sm gap-1" onClick={() => setOpen("accept")}>
						<i className="fa-solid fa-check" /> Accept
					</button>
				)}
				{canRefuse && (
					<button
						className="btn btn-outline btn-error btn-sm gap-1"
						onClick={() => setOpen("refuse")}
					>
						<i className="fa-solid fa-xmark" /> Refuse
					</button>
				)}
				{canCancel && (
					<button
						className="btn btn-ghost btn-sm gap-1 text-error"
						onClick={() => setOpen("cancel")}
					>
						<i className="fa-solid fa-trash" /> Cancel Series
					</button>
				)}
			</div>

			{open === "accept" && (
				<dialog open className="modal modal-open">
					<div className="modal-box max-w-sm text-center">
						<div className="text-5xl text-success mb-4">
							<i className="fa-solid fa-circle-check"></i>
						</div>
						<h3 className="font-bold text-lg mb-2">Accept Recurring Request</h3>
						<p className="text-base-content/70 text-sm mb-6">
							Accept the weekly <strong>{subject}</strong> series with{" "}
							<strong>{otherPartyName}</strong>? Sessions will be scheduled automatically
							every week.
						</p>
						<div className="flex gap-3">
							<button className="btn btn-success flex-1" onClick={confirmAccept} disabled={isPending}>
								{isPending ? <span className="loading loading-spinner loading-sm" /> : "Confirm"}
							</button>
							<button className="btn btn-ghost flex-1" onClick={() => setOpen(null)} disabled={isPending}>
								Go Back
							</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={() => !isPending && setOpen(null)} />
				</dialog>
			)}

			{open === "refuse" && (
				<dialog open className="modal modal-open">
					<div className="modal-box max-w-sm text-center">
						<div className="text-5xl text-error mb-4">
							<i className="fa-solid fa-circle-xmark"></i>
						</div>
						<h3 className="font-bold text-lg mb-2">Refuse Recurring Request</h3>
						<p className="text-base-content/70 text-sm mb-6">
							Refuse the weekly <strong>{subject}</strong> series with{" "}
							<strong>{otherPartyName}</strong>?
						</p>
						<div className="flex gap-3">
							<button className="btn btn-error flex-1" onClick={confirmRefuse} disabled={isPending}>
								{isPending ? <span className="loading loading-spinner loading-sm" /> : "Confirm"}
							</button>
							<button className="btn btn-ghost flex-1" onClick={() => setOpen(null)} disabled={isPending}>
								Go Back
							</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={() => !isPending && setOpen(null)} />
				</dialog>
			)}

			{open === "cancel" && (
				<dialog open className="modal modal-open">
					<div className="modal-box max-w-sm text-center">
						<div className="text-5xl text-warning mb-4">
							<i className="fa-solid fa-triangle-exclamation"></i>
						</div>
						<h3 className="font-bold text-lg mb-2">Cancel Recurring Series</h3>
						<p className="text-base-content/70 text-sm mb-4">
							Cancel the weekly <strong>{subject}</strong> series with{" "}
							<strong>{otherPartyName}</strong>? Future sessions will be cancelled — each
							following its own refund policy if already paid. Past sessions are not affected.
						</p>
						<div className="flex gap-3">
							<button className="btn btn-error flex-1" onClick={confirmCancel} disabled={isPending}>
								{isPending ? <span className="loading loading-spinner loading-sm" /> : "Confirm"}
							</button>
							<button className="btn btn-ghost flex-1" onClick={() => setOpen(null)} disabled={isPending}>
								Go Back
							</button>
						</div>
					</div>
					<div className="modal-backdrop" onClick={() => !isPending && setOpen(null)} />
				</dialog>
			)}
		</>
	);
}

"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import {
	acceptClassById,
	refuseClassById,
	cancelClassById,
	proposeCounterOffer,
	acceptCounterOffer,
	declineCounterOffer,
} from "@/app/lib/actions/classes.actions";
import CheckoutForm from "@/app/ui/payment/checkout-form";

type ModalType = "accept" | "refuse" | "cancel" | "pay" | "counter";

interface Props {
	id: string;
	subject: string;
	otherPartyName: string;
	role: "student" | "teacher";
	canAccept?: boolean;
	canRefuse?: boolean;
	canCancel?: boolean;
	canPay?: boolean;
	canCounterOffer?: boolean;
	counterOfferTime?: string | null;
	isPaid?: boolean;
	hasPreAuth?: boolean;
	startTime?: string;
	totalPrice?: string;
}

export default function ClassActionModals({
	id,
	subject,
	otherPartyName,
	role,
	canAccept,
	canRefuse,
	canCancel,
	canPay,
	canCounterOffer,
	counterOfferTime,
	isPaid,
	hasPreAuth,
	startTime,
	totalPrice,
}: Props) {
	// Compute refund tier for the cancel modal
	const hoursUntil = startTime
		? (new Date(startTime).getTime() - Date.now()) / 3_600_000
		: null;
	const refundNote = isPaid
		? hoursUntil === null
			? "A refund may be issued depending on timing."
			: hoursUntil > 24
				? "You are eligible for a full refund."
				: hoursUntil > 12
					? "You are eligible for a 50% refund (cancellation within 24h of start)."
					: "No refund is available (cancellation within 12h of start)."
		: hasPreAuth
			? "Your card hold will be released immediately."
			: null;
	const [isPending, startTransition] = useTransition();
	const [open, setOpen] = useState<ModalType | null>(null);
	const [cancelError, setCancelError] = useState<string | null>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [payFetchError, setPayFetchError] = useState<string | null>(null);
	const [payLoading, setPayLoading] = useState(false);
	const [counterTime, setCounterTime] = useState("");
	const [counterError, setCounterError] = useState<string | null>(null);

	// Real <dialog> elements (via showModal()/close()) instead of a CSS-only
	// "modal-open" class: gets focus trapping, Escape-to-close, and focus
	// return to the trigger for free from the browser, none of which a plain
	// `open` attribute provides. onClose keeps `open` state in sync when the
	// dialog is dismissed natively (Escape) rather than through one of our
	// own buttons.
	const acceptRef = useRef<HTMLDialogElement>(null);
	const refuseRef = useRef<HTMLDialogElement>(null);
	const cancelRef = useRef<HTMLDialogElement>(null);
	const counterRef = useRef<HTMLDialogElement>(null);
	const payRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (open === "accept") acceptRef.current?.showModal();
		else acceptRef.current?.close();
		if (open === "refuse") refuseRef.current?.showModal();
		else refuseRef.current?.close();
		if (open === "cancel") cancelRef.current?.showModal();
		else cancelRef.current?.close();
		if (open === "counter") counterRef.current?.showModal();
		else counterRef.current?.close();
		if (open === "pay") payRef.current?.showModal();
		else payRef.current?.close();
	}, [open]);

	// Format counterOfferTime from ISO string to datetime-local input default
	const counterOfferFormatted = counterOfferTime
		? new Date(counterOfferTime).toLocaleString("en-GB", {
				weekday: "short",
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
		  })
		: null;

	function confirmAccept() {
		startTransition(async () => {
			await acceptClassById(id);
		});
	}

	function confirmRefuse() {
		startTransition(async () => {
			await refuseClassById(id);
		});
	}

	function confirmCancel() {
		setCancelError(null);
		startTransition(async () => {
			const result = await cancelClassById(id);
			if (result) setCancelError(result);
		});
	}

	function confirmCounterOffer() {
		if (!counterTime) return;
		setCounterError(null);
		startTransition(async () => {
			const result = await proposeCounterOffer(id, counterTime);
			if (result.error) setCounterError(result.error);
			else setOpen(null);
		});
	}

	function confirmAcceptCounter() {
		startTransition(async () => {
			await acceptCounterOffer(id);
		});
	}

	function confirmDeclineCounter() {
		startTransition(async () => {
			await declineCounterOffer(id);
		});
	}

	async function openPay() {
		setClientSecret(null);
		setPayFetchError(null);
		setOpen("pay");
		setPayLoading(true);
		try {
			const res = await fetch("/api/payment-intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ classId: id }),
			});
			const data = await res.json();
			if (data.error) {
				setPayFetchError(data.error);
			} else {
				setClientSecret(data.clientSecret);
			}
		} catch {
			setPayFetchError("Failed to initialize payment. Please try again.");
		} finally {
			setPayLoading(false);
		}
	}

	return (
		<>
			{/* Counter-offer banner (student sees pending counter-offer) */}
			{role === "student" && counterOfferTime && counterOfferFormatted && (
				<div className="alert alert-warning flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
					<div className="flex items-center gap-2">
						<i className="fa-solid fa-clock-rotate-left text-lg"></i>
						<div>
							<p className="font-semibold text-sm">Teacher proposed a new time</p>
							<p className="text-sm">{counterOfferFormatted}</p>
						</div>
					</div>
					<div className="flex gap-2 sm:ml-auto">
						<button
							className="btn btn-success btn-sm gap-1"
							onClick={confirmAcceptCounter}
							disabled={isPending}
						>
							{isPending ? <span className="loading loading-spinner loading-xs" /> : <i className="fa-solid fa-check" />}
							Accept
						</button>
						<button
							className="btn btn-outline btn-error btn-sm gap-1"
							onClick={confirmDeclineCounter}
							disabled={isPending}
						>
							<i className="fa-solid fa-xmark" /> Decline
						</button>
					</div>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex flex-col sm:flex-row flex-wrap gap-3">
				{canAccept && (
					<button
						className="btn btn-success gap-2 sm:w-auto w-full"
						onClick={() => setOpen("accept")}
					>
						<i className="fa-solid fa-check"></i> Accept Class
					</button>
				)}
				{canCounterOffer && (
					<button
						className="btn btn-outline btn-warning gap-2 sm:w-auto w-full"
						onClick={() => { setCounterError(null); setCounterTime(""); setOpen("counter"); }}
					>
						<i className="fa-solid fa-clock-rotate-left"></i> Suggest Alternative Time
					</button>
				)}
				{canRefuse && (
					<button
						className="btn btn-outline btn-error gap-2 sm:w-auto w-full"
						onClick={() => setOpen("refuse")}
					>
						<i className="fa-solid fa-xmark"></i> Refuse
					</button>
				)}
				{canPay && (
					<button className="btn btn-primary gap-2 sm:w-auto w-full" onClick={openPay}>
						<i className="fa-solid fa-money-bill-wave"></i> Pay Now
					</button>
				)}
				{canCancel && (
					<button
						className="btn btn-ghost gap-2 text-error sm:w-auto w-full"
						onClick={() => {
							setCancelError(null);
							setOpen("cancel");
						}}
					>
						<i className="fa-solid fa-trash"></i> Cancel Class
					</button>
				)}
			</div>

			{/* Accept modal */}
			<dialog ref={acceptRef} className="modal" onClose={() => setOpen(null)}>
				<div className="modal-box max-w-sm text-center">
					<div className="text-5xl text-success mb-4">
						<i className="fa-solid fa-circle-check"></i>
					</div>
					<h3 className="font-bold text-lg mb-2">Accept Request</h3>
					<p className="text-base-content/70 text-sm mb-6">
						Accept the <strong>{subject}</strong> class with{" "}
						<strong>{otherPartyName}</strong>?
					</p>
					<div className="flex gap-3">
						<button
							className="btn btn-success flex-1"
							onClick={confirmAccept}
							disabled={isPending}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Confirm"
							)}
						</button>
						<button
							className="btn btn-ghost flex-1"
							onClick={() => setOpen(null)}
							disabled={isPending}
						>
							Go Back
						</button>
					</div>
				</div>
				<div
					className="modal-backdrop"
					onClick={() => !isPending && setOpen(null)}
				/>
			</dialog>

			{/* Refuse modal */}
			<dialog ref={refuseRef} className="modal" onClose={() => setOpen(null)}>
				<div className="modal-box max-w-sm text-center">
					<div className="text-5xl text-error mb-4">
						<i className="fa-solid fa-circle-xmark"></i>
					</div>
					<h3 className="font-bold text-lg mb-2">Refuse Request</h3>
					<p className="text-base-content/70 text-sm mb-6">
						Refuse the <strong>{subject}</strong> class with{" "}
						<strong>{otherPartyName}</strong>?
					</p>
					<div className="flex gap-3">
						<button
							className="btn btn-error flex-1"
							onClick={confirmRefuse}
							disabled={isPending}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Confirm"
							)}
						</button>
						<button
							className="btn btn-ghost flex-1"
							onClick={() => setOpen(null)}
							disabled={isPending}
						>
							Go Back
						</button>
					</div>
				</div>
				<div
					className="modal-backdrop"
					onClick={() => !isPending && setOpen(null)}
				/>
			</dialog>

			{/* Cancel modal */}
			<dialog ref={cancelRef} className="modal" onClose={() => setOpen(null)}>
				<div className="modal-box max-w-sm text-center">
					<div className="text-5xl text-warning mb-4">
						<i className="fa-solid fa-triangle-exclamation"></i>
					</div>
					<h3 className="font-bold text-lg mb-2">Confirm Cancellation</h3>
					<p className="text-base-content/70 text-sm mb-4">
						Cancel the <strong>{subject}</strong> class with{" "}
						<strong>{otherPartyName}</strong>?
					</p>
					{refundNote && (
						<div role="alert" className="alert alert-info text-sm py-2 mb-4">
							<i className="fa-solid fa-circle-info"></i>
							<span>{refundNote}</span>
						</div>
					)}
					{cancelError && (
						<div
							role="alert"
							className="alert alert-error text-sm py-2 mb-4"
						>
							<i className="fa-solid fa-circle-xmark"></i>
							<span>{cancelError}</span>
						</div>
					)}
					<div className="flex gap-3">
						<button
							className="btn btn-error flex-1"
							onClick={confirmCancel}
							disabled={isPending}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Confirm"
							)}
						</button>
						<button
							className="btn btn-ghost flex-1"
							onClick={() => setOpen(null)}
							disabled={isPending}
						>
							Go Back
						</button>
					</div>
				</div>
				<div
					className="modal-backdrop"
					onClick={() => !isPending && setOpen(null)}
				/>
			</dialog>

			{/* Counter-offer modal */}
			<dialog ref={counterRef} className="modal" onClose={() => setOpen(null)}>
				<div className="modal-box max-w-sm">
					<button
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={() => !isPending && setOpen(null)}
						aria-label="Close"
					>
						<i className="fa-solid fa-xmark"></i>
					</button>
					<div className="text-4xl text-warning mb-3 text-center">
						<i className="fa-solid fa-clock-rotate-left"></i>
					</div>
					<h3 className="font-bold text-lg mb-1 text-center">Suggest Alternative Time</h3>
					<p className="text-base-content/70 text-sm mb-5 text-center">
						Propose a new time for the <strong>{subject}</strong> class with{" "}
						<strong>{otherPartyName}</strong>.
					</p>
					<div className="flex flex-col gap-1.5 mb-4">
						<label htmlFor="counter-offer-time" className="text-sm font-medium">New date &amp; time</label>
						<input
							id="counter-offer-time"
							type="datetime-local"
							className="input input-bordered w-full"
							value={counterTime}
							onChange={(e) => setCounterTime(e.target.value)}
						/>
					</div>
					{counterError && (
						<div role="alert" className="alert alert-error text-sm py-2 mb-4">
							<i className="fa-solid fa-circle-xmark"></i>
							<span>{counterError}</span>
						</div>
					)}
					<div className="flex gap-3">
						<button
							className="btn btn-warning flex-1"
							onClick={confirmCounterOffer}
							disabled={isPending || !counterTime}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Send Proposal"
							)}
						</button>
						<button
							className="btn btn-ghost flex-1"
							onClick={() => setOpen(null)}
							disabled={isPending}
						>
							Go Back
						</button>
					</div>
				</div>
				<div
					className="modal-backdrop"
					onClick={() => !isPending && setOpen(null)}
				/>
			</dialog>

			{/* Pay modal */}
			<dialog ref={payRef} className="modal" onClose={() => setOpen(null)}>
				<div className="modal-box max-w-lg">
					<button
						className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
						onClick={() => !payLoading && setOpen(null)}
						aria-label="Close"
					>
						<i className="fa-solid fa-xmark"></i>
					</button>
					<h3 className="font-bold text-lg mb-4">Pay for Class</h3>

					{payLoading && (
						<div className="flex justify-center py-8">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					)}

					{payFetchError && (
						<div role="alert" className="alert alert-error text-sm">
							<i className="fa-solid fa-triangle-exclamation"></i>
							<span>{payFetchError}</span>
						</div>
					)}

					{!payLoading && clientSecret && (
						<>
							<div className="flex justify-between items-center text-sm p-3 bg-base-200 rounded-lg mb-4">
								<span className="text-base-content/70">
									{subject} with {otherPartyName}
								</span>
								<span className="font-bold text-lg">{totalPrice}€</span>
							</div>
							<CheckoutForm clientSecret={clientSecret} classId={id} />
						</>
					)}
				</div>
				<div
					className="modal-backdrop"
					onClick={() => !payLoading && setOpen(null)}
				/>
			</dialog>
		</>
	);
}

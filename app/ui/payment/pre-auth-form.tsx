"use client";

import { useState, useTransition } from "react";
import {
	PaymentElement,
	useStripe,
	useElements,
	Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
	createClassWithPreAuth,
	type PreAuthClassData,
} from "@/app/lib/classes/create-class-with-pre-auth";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

interface InnerProps {
	totalPrice: number;
	classData: PreAuthClassData;
	teacherName: string;
	onBack: () => void;
}

function PreAuthInner({ totalPrice, classData, teacherName, onBack }: InnerProps) {
	const stripe = useStripe();
	const elements = useElements();
	const [isPending, startTransition] = useTransition();
	const [stripeLoading, setStripeLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isLoading = isPending || stripeLoading;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!stripe || !elements) return;

		setError(null);
		setStripeLoading(true);

		const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
			elements,
			redirect: "if_required",
		});

		setStripeLoading(false);

		if (stripeError) {
			setError(stripeError.message ?? "Payment authorization failed.");
			return;
		}

		if (paymentIntent?.status === "requires_capture") {
			startTransition(async () => {
				const result = await createClassWithPreAuth(classData, paymentIntent.id);
				if (result?.error) setError(result.error);
			});
		} else {
			setError("Unexpected payment status. Please try again.");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{/* Summary */}
			<div className="bg-base-200 rounded-xl p-4 flex flex-col gap-2 text-sm">
				<p className="font-semibold text-base-content/70 text-xs uppercase tracking-wide mb-1">
					Booking summary
				</p>
				<div className="flex justify-between">
					<span className="text-base-content/60">Teacher</span>
					<span className="font-medium">{teacherName}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-base-content/60">Duration</span>
					<span className="font-medium">{classData.durationInHours}h</span>
				</div>
				<div className="divider my-0" />
				<div className="flex justify-between font-bold text-base">
					<span>Total</span>
					<span>{totalPrice.toFixed(2)} €</span>
				</div>
			</div>

			{/* Info callout */}
			<div role="alert" className="alert alert-info text-sm py-2.5">
				<i className="fa-solid fa-circle-info shrink-0"></i>
				<span>
					This is a <strong>pre-authorization only</strong> — your card will not be
					charged until the teacher accepts your request. If refused or cancelled, the
					hold is released immediately.
				</span>
			</div>

			<PaymentElement options={{ layout: "accordion" }} />

			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-triangle-exclamation"></i>
					<span>{error}</span>
				</div>
			)}

			<div className="flex gap-3">
				<button
					type="button"
					className="btn btn-ghost flex-1"
					onClick={onBack}
					disabled={isLoading}
				>
					<i className="fa-solid fa-arrow-left"></i> Back
				</button>
				<button
					type="submit"
					className="btn btn-primary flex-1"
					disabled={isLoading || !stripe || !elements}
				>
					{isLoading ? (
						<span className="loading loading-spinner loading-sm" />
					) : (
						<>
							<i className="fa-solid fa-lock"></i> Authorize &amp; Request
						</>
					)}
				</button>
			</div>

			<p className="text-xs text-center text-base-content/40">
				<i className="fa-solid fa-shield-halved mr-1"></i>
				Secured by Stripe
			</p>
		</form>
	);
}

export default function PreAuthForm(props: InnerProps & { clientSecret: string }) {
	const { clientSecret, ...rest } = props;
	return (
		<Elements
			stripe={stripePromise}
			options={{ appearance: { theme: "stripe" }, clientSecret }}
		>
			<PreAuthInner {...rest} />
		</Elements>
	);
}

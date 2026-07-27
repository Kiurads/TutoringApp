"use client";

import { useState } from "react";
import {
	PaymentElement,
	useStripe,
	useElements,
	Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

interface InnerProps {
	onSaved: (setupIntentId: string) => void;
	onBack: () => void;
	submitLabel?: string;
}

function SetupCardInner({ onSaved, onBack, submitLabel }: InnerProps) {
	const stripe = useStripe();
	const elements = useElements();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!stripe || !elements) return;

		setError(null);
		setIsLoading(true);

		const { error: stripeError, setupIntent } = await stripe.confirmSetup({
			elements,
			redirect: "if_required",
		});

		setIsLoading(false);

		if (stripeError) {
			setError(stripeError.message ?? "Card setup failed.");
			return;
		}

		if (setupIntent?.status === "succeeded") {
			onSaved(setupIntent.id);
		} else {
			setError("Unexpected setup status. Please try again.");
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<div role="alert" className="alert alert-info text-sm py-2.5">
				<i className="fa-solid fa-circle-info shrink-0"></i>
				<span>
					Recurring classes charge this card automatically each week, once a
					session is scheduled. You can update it any time.
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
							<i className="fa-solid fa-lock"></i> {submitLabel ?? "Save Card"}
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

export default function SetupCardForm(props: InnerProps & { clientSecret: string }) {
	const { clientSecret, ...rest } = props;
	return (
		<Elements
			stripe={stripePromise}
			options={{ appearance: { theme: "stripe" }, clientSecret }}
		>
			<SetupCardInner {...rest} />
		</Elements>
	);
}

"use client";

import { useState } from "react";
import {
	PaymentElement,
	useStripe,
	useElements,
	Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

function PaymentForm(props: { classId: string }) {
	const { classId } = props;
	const stripe = useStripe();
	const elements = useElements();

	const [message, setMessage] = useState<string | null | undefined>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!stripe || !elements) {
			// Stripe.js hasn't yet loaded.
			// Make sure to disable form submission until Stripe.js has loaded.
			return;
		}

		setIsLoading(true);

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url:
					"http://localhost:3000/main/classes/" +
					classId +
					"/pay/success",
			},
		});

		if (error.type === "card_error" || error.type === "validation_error") {
			setMessage(error.message);
		} else {
			setMessage("An unexpected error occurred.");
		}

		setIsLoading(false);
	};

	const paymentElementOptions = {
		layout: "accordion",
	};

	return (
		<form className="card-body" id="payment-form" onSubmit={handleSubmit}>
			<PaymentElement
				id="payment-element"
				options={paymentElementOptions}
			/>
			<button disabled={isLoading || !stripe || !elements} id="submit">
				<span id="button-text">
					{isLoading ? (
						<div className="spinner" id="spinner"></div>
					) : (
						"Pay now"
					)}
				</span>
			</button>
			{/* Show any error or success messages */}
			{message && <div id="payment-message">{message}</div>}
		</form>
	);
}

export default function CheckoutForm(props: { clientSecret; classId: string }) {
	const { clientSecret, classId } = props;
	const appearance = {
		theme: "stripe",
	};
	return (
		<Elements stripe={stripePromise} options={{ appearance, clientSecret }}>
			<PaymentForm classId={classId} />
		</Elements>
	);
}

"use client";

import { createPaymentIntent } from "@/app/lib/actions/payments.actions";
import {
	CardElement,
	Elements,
	useElements,
	useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useState } from "react";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm() {
	const stripe = useStripe();
	const elements = useElements();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [isCardComplete, setIsCardComplete] = useState(false); // Track if card details are complete

	const handleCardChange = (event: any) => {
		// Update state based on whether the card details are complete
		setIsCardComplete(event.complete);
		setError(null); // Clear any previous errors
	};

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const cardElement = elements?.getElement(CardElement);

		if (!stripe || !cardElement) {
			setError(
				"Stripe has not been initialized or card element is missing."
			);
			setLoading(false);
			return;
		}

		// Ensure the card details are complete before proceeding
		if (!isCardComplete) {
			setError("Please enter valid card details.");
			setLoading(false);
			return;
		}

		try {
			const clientSecret = await createPaymentIntent(1);

			if (!clientSecret) {
				setError("Failed to create payment intent.");
				setLoading(false);
				return;
			}

			const { error: stripeError, paymentIntent } =
				await stripe.confirmCardPayment(clientSecret, {
					payment_method: { card: cardElement },
				});

			if (stripeError) {
				setError(stripeError.message || "Payment failed.");
				setLoading(false);
				return;
			}

			if (paymentIntent && paymentIntent.status === "succeeded") {
				console.log("Payment succeeded:", paymentIntent);
				// Handle successful payment (e.g., show success message, redirect, etc.)
			}
		} catch (error) {
			console.error(error);
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="w-96" onSubmit={onSubmit}>
			<CardElement
				onChange={handleCardChange} // Track changes to the card element
				options={{
					style: {
						base: {
							fontSize: "16px",
							color: "#424770",
							"::placeholder": {
								color: "#aab7c4",
							},
						},
						invalid: {
							color: "#9e2146",
						},
					},
				}}
			/>
			{error && <div className="text-red-500">{error}</div>}
			<button
				type="submit"
				disabled={!stripe || loading || !isCardComplete} // Disable if card is incomplete
			>
				{loading ? "Processing..." : "Submit"}
			</button>
		</form>
	);
}

export default function PaymentForm() {
	return (
		<Elements stripe={stripePromise}>
			<CheckoutForm />
		</Elements>
	);
}

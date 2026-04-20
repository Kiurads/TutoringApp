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

function PaymentForm(props: { classId: string }) {
	const { classId } = props;
	const stripe = useStripe();
	const elements = useElements();
	const [message, setMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!stripe || !elements) return;

		setIsLoading(true);
		setMessage(null);

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/main/student/classes/${classId}/pay/success`,
			},
		});

		if (error) {
			setMessage(error.message ?? "An unexpected error occurred.");
		}

		setIsLoading(false);
	};

	return (
		<form
			id="payment-form"
			onSubmit={handleSubmit}
			className="flex flex-col gap-4"
		>
			<h2 className="text-lg font-semibold">Payment Details</h2>

			<PaymentElement
				id="payment-element"
				options={{ layout: "accordion" }}
			/>

			{message && (
				<div role="alert" className="alert alert-error text-sm">
					<i className="fa-solid fa-triangle-exclamation"></i>
					<span>{message}</span>
				</div>
			)}

			<button
				className="btn btn-primary w-full"
				type="submit"
				disabled={isLoading || !stripe || !elements}
			>
				{isLoading ? (
					<>
						<i className="fa-solid fa-spinner animate-spin"></i>
						Processing...
					</>
				) : (
					<>
						<i className="fa-solid fa-lock"></i>
						Pay now
					</>
				)}
			</button>

			<p className="text-xs text-center text-base-content/40">
				<i className="fa-solid fa-shield-halved mr-1"></i>
				Secured by Stripe
			</p>
		</form>
	);
}

export default function CheckoutForm(props: {
	clientSecret: string;
	classId: string;
}) {
	const { clientSecret, classId } = props;

	return (
		<Elements
			stripe={stripePromise}
			options={{ appearance: { theme: "stripe" }, clientSecret }}
		>
			<PaymentForm classId={classId} />
		</Elements>
	);
}

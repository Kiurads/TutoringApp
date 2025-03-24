"use client";

import { useState } from "react";
import {
	PaymentElement,
	useStripe,
	useElements,
	Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ClassData } from "@/app/lib/actions/classes.actions";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

function PaymentForm(props: { classData: ClassData }) {
	const { classData } = props;
	const stripe = useStripe();
	const elements = useElements();
	const [message, setMessage] = useState<string | null | undefined>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsLoading(true);

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `http://localhost:3000/main/classes/${classData.id}/pay/success`,
			},
		});

		if (error) {
			setMessage(error.message || "An unexpected error occurred.");
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
			<div className="flex justify-between items-center">
				<button
					className={`btn ${isLoading ? "loading" : ""}`}
					type="submit"
					disabled={isLoading || !stripe || !elements}
				>
					Pay now
				</button>
				{message && (
					<p className="text-red-500 mt-4 text-sm">{message}</p>
				)}
			</div>
		</form>
	);
}

export default function CheckoutForm(props: {
	clientSecret;
	classData: ClassData;
}) {
	const { clientSecret, classData } = props;
	const appearance = { theme: "stripe" };

	return (
		<Elements stripe={stripePromise} options={{ appearance, clientSecret }}>
			<PaymentForm classData={classData} />
		</Elements>
	);
}

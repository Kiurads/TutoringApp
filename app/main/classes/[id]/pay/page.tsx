import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { stripe } from "@/app/lib/stripe";
import CheckoutForm from "@/app/ui/payment/checkout-form";

export default async function ClassPayPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const classData = await fetchClassById(id);

	if (!classData || !classData.totalPrice) {
		return <div>Class not found</div>;
	}

	const classPrice = parseFloat(classData?.totalPrice) * 100;

	// Create PaymentIntent as soon as the page loads
	const { client_secret: clientSecret } = await stripe.paymentIntents.create({
		amount: classPrice,
		currency: "eur",
		// In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
		automatic_payment_methods: {
			enabled: true,
		},
	});

	return (
		<div className="hero bg-base-100 min-h-screen" id="checkout">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<CheckoutForm clientSecret={clientSecret} />
				</div>
			</div>
		</div>
	);
}

import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { stripe } from "@/app/lib/stripe";
import CheckoutForm from "@/app/ui/payment/checkout-form";

export default async function ClassPayPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const classData = await fetchClassById(id);

	if (!classData || !classData.totalPrice) {
		return <div className="text-center text-lg">Class not found</div>;
	}

	const classPrice = parseFloat(classData?.totalPrice) * 100;

	// Create PaymentIntent as soon as the page loads
	const { client_secret: clientSecret } = await stripe.paymentIntents.create({
		amount: classPrice,
		currency: "eur",
		metadata: { classId: classData.id },
	});

	return (
		<div className="hero bg-base-200 min-h-screen" id="checkout">
			<div className="hero-content flex-col lg:flex-row lg:justify-between lg:px-20">
				{/* Left side content with class details */}
				<div className="w-full lg:w-1/3 mb-10 lg:mb-0 card shadow-xl bg-base-100 p-6">
					<h2 className="text-2xl font-semibold text-center mb-4">
						{classData.subject.name} Class
					</h2>

					{/* Teacher Info */}
					<div className="mb-6">
						<h3 className="font-semibold text-lg">Teacher:</h3>
						<p>
							{classData.teacher.firstName}{" "}
							{classData.teacher.lastName}
						</p>
						<p className="text-sm text-gray-500">
							{classData.teacher.email}
						</p>
					</div>

					{/* Student Info */}
					<div className="mb-6">
						<h3 className="font-semibold text-lg">Student:</h3>
						<p>
							{classData.student.firstName}{" "}
							{classData.student.lastName}
						</p>
						<p className="text-sm text-gray-500">
							{classData.student.email}
						</p>
					</div>

					{/* Class Duration */}
					<div className="mb-6">
						<h3 className="font-semibold text-lg">Duration:</h3>
						<p>{classData.durationInHours} hours</p>
					</div>

					{/* Class Price */}
					<div className="mb-6">
						<h3 className="font-semibold text-lg">Total Price:</h3>
						<p className="text-xl">{classData.totalPrice} €</p>
					</div>
				</div>

				{/* Right side with the payment form */}
				<div className="card w-full lg:w-2/3 shadow-2xl p-6">
					<CheckoutForm
						clientSecret={clientSecret}
						classData={classData}
					/>
				</div>
			</div>
		</div>
	);
}

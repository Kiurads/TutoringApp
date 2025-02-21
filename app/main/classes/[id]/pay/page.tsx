import { fetchClassById } from "@/app/lib/actions/classes.actions";
import PaymentForm from "@/app/ui/payment/payment-form";

export default async function PayClassPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const classId = params.id;
	const classData = await fetchClassById(classId);

	return (
		<div className="flex flex-col items-center w-screen">
			<h1>Checkout</h1>
			<PaymentForm />
		</div>
	);
}

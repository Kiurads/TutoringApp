import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { notFound } from "next/navigation";

type PaymentSuccessPageProps = {
	params: { id: string };
	searchParams: {
		payment_intent: string;
		payment_intent_client_secret: string;
		redirect_status: string;
	};
};

export default async function PaymentSuccessPage({
	params,
	searchParams,
}: PaymentSuccessPageProps) {
	const { id } = await params;
	const { payment_intent, payment_intent_client_secret, redirect_status } =
		await searchParams;

	if (!payment_intent || !payment_intent_client_secret || !redirect_status) {
		notFound();
	}

	const classData = await fetchClassById(id);

	if (!classData) {
		notFound();
	}

	// Trigger revalidation of the /main/classes path
	const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`; // Use absolute URL with site domain
	await fetch(apiUrl, {
		method: "POST",
		body: JSON.stringify({ path: "/main/classes" }),
		headers: {
			"Content-Type": "application/json",
		},
	});

	return (
		<div className="flex flex-col items-center justify-center p-6">
			<div className="alert alert-success mb-4">
				<span>The class was paid successfully!</span>
			</div>

			<div className="card w-full max-w-md bg-base-100 shadow-md">
				<div className="card-body">
					<h2 className="card-title">Class Details</h2>
					<p>
						<strong>Class time:</strong>{" "}
						{new Date(classData.startTime).toLocaleString()}
					</p>
					<p>
						<strong>Status:</strong> {classData.status}
					</p>
					<p>
						<strong>Student:</strong>{" "}
						{classData.student.firstName +
							" " +
							classData.student.lastName}
					</p>
					<p>
						<strong>Teacher:</strong>{" "}
						{classData.teacher.firstName +
							" " +
							classData.teacher.lastName}
					</p>
					<p>
						<strong>Subject:</strong> {classData.subject.name}
					</p>
				</div>
			</div>
		</div>
	);
}

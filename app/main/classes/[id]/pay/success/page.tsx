import { fetchClassById } from "@/app/lib/actions/classes.actions";
import ClassStatusBadge from "@/app/ui/main/classes/class-status-badge";
import Link from "next/link";
import ClassStatusBadge from "@/app/ui/main/classes/class-status-badge";
import Link from "next/link";
import { notFound } from "next/navigation";

// Define the component props
interface PaymentSuccessPageProps {
// Define the component props
interface PaymentSuccessPageProps {
	params: { id: string };
	searchParams: {
		payment_intent: string;
		payment_intent_client_secret: string;
		redirect_status: string;
	};
}
}

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

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 bg-base-100">
			<div className="alert alert-success shadow-lg w-full max-w-lg mb-6">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>
						Payment successful! Your class has been confirmed!
					</span>
				</div>
			</div>

			<div className="card w-full max-w-lg bg-base-100 shadow-xl">
				<div className="card-body">
					<p className="text-lg">
						<strong>Class time:</strong>{" "}
						{new Date(classData.startTime).toLocaleString()}
					</p>
					<p className="text-lg flex items-center gap-2">
						<strong>Status:</strong>{" "}
						<ClassStatusBadge status={classData.status} />
					</p>
					<p className="text-lg">
						<strong>Student:</strong> {classData.student.firstName}{" "}
						{classData.student.lastName}
					</p>
					<p className="text-lg">
						<strong>Teacher:</strong> {classData.teacher.firstName}{" "}
						{classData.teacher.lastName}
					</p>
					<p className="text-lg">
						<strong>Subject:</strong> {classData.subject.name}
					</p>
				</div>
			</div>

			<Link href="/main/classes" className="btn btn-primary mt-6">
				Go to Classes
			</Link>
		</div>
	);
}

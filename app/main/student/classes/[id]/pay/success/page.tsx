import { fetchClassById } from "@/app/lib/actions/classes.actions";
import ClassStatusBadge from "@/app/ui/main/classes/class-status-badge";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PaymentSuccessPageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{
		payment_intent: string;
		payment_intent_client_secret: string;
		redirect_status: string;
	}>;
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
		<div className="flex items-center justify-center py-12 animate-fade-in">
			<div className="card bg-base-200 shadow-lg w-full max-w-lg">
				<div className="card-body items-center text-center gap-4">
					<div className="text-6xl text-success">
						<i className="fa-solid fa-circle-check"></i>
					</div>
					<h2 className="card-title text-xl">Payment Successful!</h2>
					<p className="text-base-content/70">
						Your class has been confirmed and is ready to go.
					</p>

					<div className="w-full border-t border-base-300 pt-4 flex flex-col gap-3 text-left">
						<div className="flex justify-between">
							<span className="text-base-content/60 text-sm">
								Subject
							</span>
							<span className="font-medium">
								{classData.subject}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-base-content/60 text-sm">
								Teacher
							</span>
							<span className="font-medium">
								{classData.teacher?.name ?? "TBD"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-base-content/60 text-sm">
								Student
							</span>
							<span className="font-medium">
								{classData.student.name}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-base-content/60 text-sm">
								Date &amp; time
							</span>
							<span className="font-medium">
								{new Date(classData.startTime).toLocaleString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-base-content/60 text-sm">
								Status
							</span>
							<ClassStatusBadge status={classData.status} />
						</div>
					</div>

					<Link
						href="/main/student/classes"
						className="btn btn-primary w-full mt-2"
					>
						Go to My Classes
					</Link>
				</div>
			</div>
		</div>
	);
}

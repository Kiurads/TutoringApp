import { auth } from "@/auth";
import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { fetchReviewByClassId } from "@/app/lib/actions/ratings.actions";
import ClassInfoCard from "@/app/ui/main/classes/details/class-info-card";
import ClassActionModals from "@/app/ui/main/classes/details/class-action-modals";
import LeaveReviewForm from "@/app/ui/main/classes/review/leave-review-form";
import Link from "next/link";

export default async function StudentClassDetailsPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;

	const [classData, session] = await Promise.all([
		fetchClassById(id),
		auth(),
	]);

	if (!classData) {
		return (
			<div className="flex flex-col gap-6">
				<Link href="/main/student/classes" className="btn btn-ghost btn-sm w-fit gap-2">
					<i className="fa-solid fa-arrow-left"></i> Back to Classes
				</Link>
				<div className="text-center text-error py-16">Class not found.</div>
			</div>
		);
	}

	const currentUser = session?.user?.email
		? await fetchUserByEmail(session.user.email)
		: null;

	const requestedBySelf = currentUser?.id === classData.requesterId;
	const { status, paid, hasPreAuth } = classData;

	const canAccept = status === "requested" && !requestedBySelf;
	const canRefuse = status === "requested" && !requestedBySelf;
	const canCancel =
		(status === "requested" && requestedBySelf) ||
		status === "scheduled";
	// Pre-auth classes are auto-paid on teacher acceptance — no manual pay needed
	const canPay = !paid && !hasPreAuth && (status === "scheduled" || status === "completed");

	const hasCounterOffer = !!classData.counterOfferTime && status === "requested";
	const hasActions = canAccept || canRefuse || canCancel || canPay || hasCounterOffer;

	const existingReview =
		status === "completed" && classData.teacher
			? await fetchReviewByClassId(id)
			: null;

	const otherPartyName = classData.teacher?.name ?? "the teacher";

	return (
		<div className="flex flex-col gap-6">
			<Link href="/main/student/classes" className="btn btn-ghost btn-sm w-fit gap-2">
				<i className="fa-solid fa-arrow-left"></i> Back to Classes
			</Link>

			<ClassInfoCard classDetails={classData} />

			{hasPreAuth && !paid && (
				<div role="alert" className="alert alert-success animate-fade-in">
					<i className="fa-solid fa-lock"></i>
					<span>
						<strong>Payment pre-authorized.</strong> Your card hold will be captured automatically when the teacher accepts. If refused, the hold is released immediately.
					</span>
				</div>
			)}

			{hasActions && (
				<div className="card bg-base-200 shadow-lg">
					<div className="card-body gap-4">
						<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
							Actions
						</h3>
						<ClassActionModals
							id={id}
							subject={classData.subject}
							otherPartyName={otherPartyName}
							role="student"
							canAccept={canAccept}
							canRefuse={canRefuse}
							canCancel={canCancel}
							canPay={canPay}
							counterOfferTime={classData.counterOfferTime}
							isPaid={paid}
							hasPreAuth={hasPreAuth}
							startTime={classData.startTime}
							totalPrice={classData.totalPrice}
						/>
					</div>
				</div>
			)}

			{status === "completed" && classData.teacher && (
				<LeaveReviewForm
					classId={id}
					teacherId={classData.teacher.id}
					teacherName={classData.teacher.name}
					existingReview={existingReview}
				/>
			)}
		</div>
	);
}

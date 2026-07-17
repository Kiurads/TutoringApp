import { auth } from "@/auth";
import { fetchClassById } from "@/app/lib/actions/classes.actions";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import ClassInfoCard from "@/app/ui/main/classes/details/class-info-card";
import ClassActionModals from "@/app/ui/main/classes/details/class-action-modals";
import JoinClassCard from "@/app/ui/main/classes/details/join-class-card";
import Link from "next/link";

export default async function TeacherClassDetailsPage(props: {
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
				<Link href="/main/teacher/classes" className="btn btn-ghost btn-sm w-fit gap-2">
					<i className="fa-solid fa-arrow-left"></i> Back to Classes
				</Link>
				<div className="text-center text-error py-16">Class not found.</div>
			</div>
		);
	}

	const currentUser = session?.user?.email
		? await fetchUserByEmail(session.user.email)
		: null;

	const isParticipant =
		currentUser?.role === "admin" ||
		currentUser?.id === classData.student.id ||
		currentUser?.id === classData.teacher?.id;

	if (!isParticipant) {
		return (
			<div className="flex flex-col gap-6">
				<Link href="/main/teacher/classes" className="btn btn-ghost btn-sm w-fit gap-2">
					<i className="fa-solid fa-arrow-left"></i> Back to Classes
				</Link>
				<div className="text-center text-error py-16">Class not found.</div>
			</div>
		);
	}

	const requestedBySelf = currentUser?.id === classData.requesterId;
	const { status } = classData;

	const canAccept = status === "requested" && !requestedBySelf;
	const canRefuse = status === "requested" && !requestedBySelf;
	const canCounterOffer = status === "requested" && !requestedBySelf;
	const canCancel =
		(status === "requested" && requestedBySelf) ||
		status === "scheduled";

	const hasActions = canAccept || canRefuse || canCancel;
	const otherPartyName = classData.student.name;

	return (
		<div className="flex flex-col gap-6">
			<Link href="/main/teacher/classes" className="btn btn-ghost btn-sm w-fit gap-2">
				<i className="fa-solid fa-arrow-left"></i> Back to Classes
			</Link>

			<ClassInfoCard classDetails={classData} />

			<JoinClassCard
				jitsiRoom={classData.jitsiRoom}
				startTime={classData.startTime}
				durationInHours={classData.durationInHours}
				status={status}
				displayName={currentUser?.firstName ?? "Teacher"}
			/>

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
							role="teacher"
							canAccept={canAccept}
							canRefuse={canRefuse}
							canCancel={canCancel}
							canCounterOffer={canCounterOffer}
							counterOfferTime={classData.counterOfferTime}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

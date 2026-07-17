import {
	fetchRatingById,
	fetchReviewsById,
} from "@/app/lib/actions/ratings.actions";
import { fetchUserById, fetchAllBadges, fetchEarnedBadges } from "@/app/lib/actions/users.actions";
import { fetchSubjectsByTeacherId } from "@/app/lib/actions/subjects.actions";
import { fetchAvailability } from "@/app/lib/actions/availability.actions";
import UserDetailsHeader from "@/app/ui/main/users/details/header";
import RatingCard from "@/app/ui/main/users/details/review-card";
import TeacherAvailabilityView from "@/app/ui/main/availability/teacher-availability-view";
import BadgeShowcase from "@/app/ui/main/badges/badge-showcase";
import Link from "next/link";

export default async function TeacherProfilePage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const [userData, rating, reviews, subjects, availabilitySlots, allBadges, earnedBadges] = await Promise.all([
		fetchUserById(id),
		fetchRatingById(id),
		fetchReviewsById(id),
		fetchSubjectsByTeacherId(id),
		fetchAvailability(id),
		fetchAllBadges(),
		fetchEarnedBadges(id),
	]);

	const teacherBadges = allBadges.filter(
		(b) => b.category === "milestone" || b.category === "expertise" || b.category === "pedagogy",
	);

	return (
		<div className="flex flex-col gap-6">
			{/* Back */}
			<Link href="/main/student/teachers" className="btn btn-ghost btn-sm w-fit gap-2">
				<i className="fa-solid fa-arrow-left"></i> Back to Teachers
			</Link>

			{/* Teacher header card */}
			<UserDetailsHeader user={userData} rating={rating} reviewCount={reviews.length} />

			{/* Subjects & booking CTA */}
			<div className="card bg-base-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
				<div className="flex-1">
					<p className="text-sm font-semibold text-base-content/60 mb-2">
						Teaches
					</p>
					{subjects.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{subjects.map((s) => (
								<span key={s.id} className="badge badge-primary badge-outline">
									{s.name}
								</span>
							))}
						</div>
					) : (
						<p className="text-sm text-base-content/50">No subjects listed</p>
					)}
				</div>
				<Link
					href={`/main/student/classes/request?teacher=${id}`}
					className="btn btn-primary sm:self-center"
				>
					Book a class
				</Link>
			</div>

			{/* Availability */}
			<TeacherAvailabilityView teacherId={id} slots={availabilitySlots} />

			{/* Seals & Milestones */}
			{earnedBadges.length > 0 && (
				<div className="card bg-base-200 rounded-xl p-5 flex flex-col gap-3">
					<p className="text-sm font-semibold text-base-content/60">
						Seals &amp; Achievements
					</p>
					<BadgeShowcase allBadges={teacherBadges} earnedBadges={earnedBadges} compact />
				</div>
			)}

			{/* Reviews */}
			<div>
				<h2 className="text-lg font-semibold mb-4">
					Reviews
					{reviews.length > 0 && (
						<span className="ml-2 text-base font-normal text-base-content/40">
							({reviews.length})
						</span>
					)}
				</h2>
				{reviews.length > 0 ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{reviews.map((review) => (
							<RatingCard key={review.id} rating={review} />
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12 gap-2 text-base-content/30">
						<i className="fa-regular fa-star text-3xl"></i>
						<p className="text-sm">No reviews yet for this teacher.</p>
					</div>
				)}
			</div>
		</div>
	);
}

import {
	fetchRatingById,
	fetchReviewsById,
} from "@/app/lib/actions/ratings.actions";
import { fetchUserById } from "@/app/lib/actions/users.actions";
import UserDetailsHeader from "@/app/ui/main/users/details/header";
import RatingCard from "@/app/ui/main/users/details/review-card";

export default async function UsersDetailsPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const userData = await fetchUserById(id);
	const rating = await fetchRatingById(id);
	const reviews = await fetchReviewsById(id);

	return (
		<div className="flex flex-col items-center gap-2 justify-start w-full">
			<div className="w-full pt-4 px-4 sm:px-8 lg:px-12">
				<UserDetailsHeader user={userData} rating={rating} />
			</div>

			{/* Render reviews as RatingCard components */}
			<div className="w-full pt-4 px-4 sm:px-8 lg:px-12">
				<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{reviews && reviews.length > 0 ? (
						reviews.map((review) => (
							<RatingCard key={review.id} rating={review} />
						))
					) : (
						<p>No reviews available.</p>
					)}
				</div>
			</div>
		</div>
	);
}

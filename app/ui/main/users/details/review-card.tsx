import { Rating } from "@/app/lib/actions/ratings.actions";
import TeacherRating from "./teacher-rating";

export default function RatingCard(props: { rating: Rating }) {
	const { rating } = props;

	// Format the createdAt date
	const formattedDate = rating.createdAt.toLocaleDateString("en-us", {
		weekday: "long",
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	return (
		<div className="card w-96 bg-base-200 shadow-xl">
			<div className="card-body">
				<div className="flex items-center">
					{/* Rating */}
					{rating.rating.toString()}
				</div>

				{/* Review */}
				<p className="text-sm text-gray-600 mt-2">
					{rating.review ? rating.review : "No review provided."}
				</p>

				{/* Date */}
				<div className="mt-4 text-xs text-gray-500">
					<p>Reviewed on {formattedDate}</p>
				</div>
			</div>
		</div>
	);
}

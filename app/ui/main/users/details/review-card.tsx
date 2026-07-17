import { Rating } from "@/app/lib/types/ratings.types";

const RATING_LABELS: Record<number, string> = {
	1: "Poor",
	2: "Fair",
	3: "Good",
	4: "Very good",
	5: "Excellent",
};

export default function RatingCard({ rating }: { rating: Rating }) {
	const stars = Math.round(rating.rating);

	return (
		<div className="card bg-base-200 border border-base-300 shadow-sm">
			<div className="card-body gap-3 p-5">
				{/* Stars + label */}
				<div className="flex items-center gap-2">
					<div className="flex gap-0.5">
						{[1, 2, 3, 4, 5].map((star) => (
							<i
								key={star}
								className={`fa-star text-sm ${stars >= star ? "fa-solid text-warning" : "fa-regular text-base-content/20"}`}
							/>
						))}
					</div>
					<span className="text-xs font-medium text-base-content/60">
						{RATING_LABELS[stars] ?? ""}
					</span>
				</div>

				{/* Review text */}
				{rating.review ? (
					<p className="text-sm text-base-content/80 leading-relaxed">
						&ldquo;{rating.review}&rdquo;
					</p>
				) : (
					<p className="text-sm text-base-content/30 italic">No written review.</p>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between pt-2 border-t border-base-300">
					<span className="text-xs font-medium text-base-content/60">
						{rating.studentName}
					</span>
					<span className="text-xs text-base-content/40">
						{rating.createdAt.toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</span>
				</div>
			</div>
		</div>
	);
}

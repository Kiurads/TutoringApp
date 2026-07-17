"use client";

import { useState, useTransition } from "react";
import { createReview } from "@/app/lib/actions/ratings.actions";
import { Rating } from "@/app/lib/types/ratings.types";

interface Props {
	classId: string;
	teacherId: string;
	teacherName: string;
	/** Pass existing review if already submitted (shows read-only) */
	existingReview: Rating | null;
}

function StarPicker({
	value,
	onChange,
	disabled,
}: {
	value: number;
	onChange: (v: number) => void;
	disabled: boolean;
}) {
	const [hovered, setHovered] = useState(0);
	const display = hovered || value;

	return (
		<div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					disabled={disabled}
					onMouseEnter={() => setHovered(star)}
					onClick={() => onChange(star)}
					className="text-2xl transition-transform hover:scale-110 focus:outline-none disabled:cursor-default disabled:hover:scale-100"
					aria-label={`${star} star${star > 1 ? "s" : ""}`}
				>
					<i
						className={`fa-star ${display >= star ? "fa-solid text-warning" : "fa-regular text-base-content/30"}`}
					/>
				</button>
			))}
			{value > 0 && (
				<span className="ml-2 self-center text-sm font-medium text-base-content/60">
					{RATING_LABELS[value]}
				</span>
			)}
		</div>
	);
}

const RATING_LABELS: Record<number, string> = {
	1: "Poor",
	2: "Fair",
	3: "Good",
	4: "Very good",
	5: "Excellent",
};

export default function LeaveReviewForm({
	classId,
	teacherId,
	teacherName,
	existingReview,
}: Props) {
	const [rating, setRating] = useState(existingReview?.rating ?? 0);
	const [reviewText, setReviewText] = useState(existingReview?.review ?? "");
	const [submitted, setSubmitted] = useState<Rating | null>(existingReview);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (rating === 0) {
			setError("Please select a star rating.");
			return;
		}
		setError(null);

		startTransition(async () => {
			const result = await createReview(
				classId,
				teacherId,
				rating,
				reviewText.trim() || null
			);

			if (result.error) {
				setError(result.error);
				return;
			}

			setSubmitted({
				id: "new",
				studentId: "",
				studentName: "You",
				teacherId,
				classId,
				rating,
				review: reviewText.trim() || null,
				createdAt: new Date(),
			});
		});
	}

	// ── Submitted / read-only view ────────────────────────────────────────────
	if (submitted) {
		return (
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body gap-4">
					<div className="flex items-center gap-2">
						<i className="fa-solid fa-circle-check text-success"></i>
						<h3 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide">
							Your Review
						</h3>
					</div>

					<div className="flex gap-0.5">
						{[1, 2, 3, 4, 5].map((star) => (
							<i
								key={star}
								className={`fa-star text-lg ${submitted.rating >= star ? "fa-solid text-warning" : "fa-regular text-base-content/20"}`}
							/>
						))}
						<span className="ml-2 text-sm text-base-content/60 self-center">
							{RATING_LABELS[submitted.rating]}
						</span>
					</div>

					{submitted.review && (
						<p className="text-sm text-base-content/80 leading-relaxed">
							{submitted.review}
						</p>
					)}

					<p className="text-xs text-base-content/40">
						Reviewed on{" "}
						{submitted.createdAt.toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</p>
				</div>
			</div>
		);
	}

	// ── Review form ───────────────────────────────────────────────────────────
	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body gap-4">
				<div>
					<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-0.5">
						Leave a Review
					</h3>
					<p className="text-sm text-base-content/60">
						How was your class with <strong>{teacherName}</strong>?
					</p>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div>
						<p className="text-xs font-medium text-base-content/60 mb-2">Rating</p>
						<StarPicker
							value={rating}
							onChange={setRating}
							disabled={isPending}
						/>
					</div>

					<div>
						<p className="text-xs font-medium text-base-content/60 mb-2">
							Comment <span className="text-base-content/40">(optional)</span>
						</p>
						<textarea
							className="textarea textarea-bordered w-full text-sm resize-none"
							rows={3}
							placeholder={`Share your experience with ${teacherName}…`}
							value={reviewText}
							onChange={(e) => setReviewText(e.target.value)}
							disabled={isPending}
							maxLength={500}
						/>
						<p className="text-xs text-base-content/30 text-right mt-0.5">
							{reviewText.length}/500
						</p>
					</div>

					{error && (
						<div role="alert" className="alert alert-error text-sm py-2">
							<i className="fa-solid fa-circle-exclamation"></i>
							{error}
						</div>
					)}

					<button
						type="submit"
						className="btn btn-primary w-fit"
						disabled={isPending || rating === 0}
					>
						{isPending ? (
							<>
								<span className="loading loading-spinner loading-sm"></span>
								Submitting…
							</>
						) : (
							<>
								<i className="fa-solid fa-paper-plane"></i>
								Submit Review
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}

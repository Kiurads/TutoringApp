interface Props {
	rating: number;
	reviewCount?: number;
}

export default function TeacherRating({ rating, reviewCount }: Props) {
	const rounded = Math.round(rating * 2) / 2; // round to nearest 0.5
	const noRating = rating === 0;

	return (
		<div className="flex flex-col items-end gap-1">
			<div className="flex items-center gap-1.5">
				{noRating ? (
					<span className="text-xs text-base-content/40 italic">No ratings yet</span>
				) : (
					<>
						<div className="flex gap-0.5">
							{[1, 2, 3, 4, 5].map((star) => {
								const filled = rounded >= star;
								const half = !filled && rounded >= star - 0.5;
								return (
									<span key={star} className="text-base relative inline-block">
										{/* Background (empty) star */}
										<i className="fa-regular fa-star text-base-content/20" />
										{/* Filled overlay */}
										{(filled || half) && (
											<i
												className={`fa-solid fa-star text-warning absolute inset-0 ${half ? "clip-half" : ""}`}
												style={half ? { clipPath: "inset(0 50% 0 0)" } : undefined}
											/>
										)}
									</span>
								);
							})}
						</div>
						<span className="text-sm font-semibold tabular-nums">
							{rating.toFixed(1)}
						</span>
					</>
				)}
			</div>
			{reviewCount !== undefined && reviewCount > 0 && (
				<span className="text-xs text-base-content/40">
					{reviewCount} review{reviewCount !== 1 ? "s" : ""}
				</span>
			)}
		</div>
	);
}

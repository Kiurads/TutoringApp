export default function TeacherRating(props: { rating: number }) {
	const { rating } = props;

	const ratingValue = Math.round(rating * 2) / 2;

	return (
		<div className="rating rating-lg rating-half">
			<input
				type="radio"
				name="rating-11"
				className="rating-hidden"
				defaultChecked={ratingValue === 0}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-1 bg-green-500"
				aria-label="0.5 star"
				defaultChecked={ratingValue === 0.5}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-2 bg-green-500"
				aria-label="1 star"
				defaultChecked={ratingValue === 1}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-1 bg-green-500"
				aria-label="1.5 star"
				defaultChecked={ratingValue === 1.5}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-2 bg-green-500"
				aria-label="2 star"
				defaultChecked={ratingValue === 2}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-1 bg-green-500"
				aria-label="2.5 star"
				defaultChecked={ratingValue === 2.5}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-2 bg-green-500"
				aria-label="3 star"
				defaultChecked={ratingValue === 3}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-1 bg-green-500"
				aria-label="3.5 star"
				defaultChecked={ratingValue === 3.5}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-2 bg-green-500"
				aria-label="4 star"
				defaultChecked={ratingValue === 4}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-1 bg-green-500"
				aria-label="4.5 star"
				defaultChecked={ratingValue === 4.5}
			/>
			<input
				type="radio"
				name="rating-11"
				className="mask mask-star-2 mask-half-2 bg-green-500"
				aria-label="5 star"
				defaultChecked={ratingValue === 5}
			/>
		</div>
	);
}

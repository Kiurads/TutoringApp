export default function OpinionCard(props: {
	opinion: {
		rating: number;
		text: string;
	};
}) {
	const rating = [];

	for (let i = 0; i < props.opinion.rating; i++) {
		if (i % 2 === 0) {
			rating.push(
				<input
					key={`rating-${i}`}
					disabled
					type="radio"
					name="rating-10"
					className="mask mask-star-2 mask-half-1 bg-accent"
				/>
			);
		} else {
			rating.push(
				<input
					key={`rating-${i}`}
					disabled
					type="radio"
					name="rating-10"
					className="mask mask-star-2 mask-half-2 bg-accent"
				/>
			);
		}
	}

	return (
		<blockquote className="rounded-lg bg-base-300 p-6 shadow-sm hover:bg-base-100 sm:p-8">
			<div className="flex items-center gap-4">
				<div className="rating rating-lg rating-half">{rating}</div>
			</div>
			<p className="mt-4 text-center text-base-content">
				{props.opinion.text}
			</p>
		</blockquote>
	);
}

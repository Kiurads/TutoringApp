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
		<div className="card items-center justify-center bg-base-300 w-96 shadow-xl hover:shadow-2xl hover:bg-base-200 transition-all">
			<div className="card-body">
				<p className="font-bold text-center text-lg">
					{props.opinion.text}
				</p>
				<div className="card-actions justify-center">
					<div className="rating rating-lg rating-half">{rating}</div>
				</div>
			</div>
		</div>
	);
}

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
		<div className="flex justify-center items-center">
			<div className="card items-center justify-center bg-base-300 w-full h-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl shadow-xl hover:shadow-2xl hover:bg-base-200 transition-all">
				<div className="card-body sm:p-2 md:p-4">
					<p className="font-bold text-center md:text-sm">
						{props.opinion.text}
					</p>
					<div className="card-actions justify-center mt-4">
						<div className="rating rating-lg rating-half">
							{rating}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

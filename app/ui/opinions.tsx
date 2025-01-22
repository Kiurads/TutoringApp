import OpinionCard from "./opinion-card";

export default function Opinions() {
	const opinions = [
		{
			text: "The tutor's dedication is truly remarkable!",
			rating: 10,
		},
		{
			text: "Outstanding support with the practical work!",
			rating: 9,
		},
		{
			text: "I don't feel like my question is stupid, as I would if I were asking a professor!",
			rating: 10,
		},
		{
			text: "Support and quality of explanation!",
			rating: 10,
		},
		{
			text: "The tutor's available and eager to resolve any errors that arise during exercises or practical work!",
			rating: 9,
		},
	];

	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-2 py-6 sm:px-6 lg:px-4 lg:py-8">
				<h2 className="text-center text-4xl font-bold tracking-tight text-base-content sm:text-5xl">
					Read <span className="text-accent">trusted reviews</span>{" "}
					from our customers
				</h2>

				<div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-8">
					{opinions.map((opinion, index) => (
						<OpinionCard key={index} opinion={opinion} />
					))}
				</div>
			</div>
		</section>
	);
}

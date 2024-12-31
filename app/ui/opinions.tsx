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
		<div className="flex space-x-4 overflow-x-auto bg-base-100 p-20">
			{opinions.map((opinion) => (
				<OpinionCard
					key={opinions.indexOf(opinion)}
					opinion={opinion}
				/>
			))}
		</div>
	);
}

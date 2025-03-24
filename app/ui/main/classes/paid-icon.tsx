export default function ClassPaidIcon(props: { status: boolean }) {
	const { status } = props;

	return (
		<span
			className={`text-lg font-bold ${
				status ? "text-success" : "text-error"
			}`}
		>
			{status ? (
				<i className="fa-solid fa-check"></i>
			) : (
				<i className="fa-solid fa-times"></i>
			)}
		</span>
	);
}

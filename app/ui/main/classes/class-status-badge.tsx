export default function ClassStatusBadge(props: { status: string }) {
	const { status } = props;

	return (
		<span
			className={`badge badge-outline capitalize ${
				status === "completed"
					? "badge-success"
					: status === "scheduled"
					? "badge-info"
					: status === "refused" || status === "cancelled"
					? "badge-error"
					: "badge-warning"
			}`}
		>
			{status}
		</span>
	);
}

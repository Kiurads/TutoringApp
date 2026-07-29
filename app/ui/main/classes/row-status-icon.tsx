// The booked-classes tables mark a row as pending/unpaid with a colored
// left border alone — no backup for colorblind users. This renders a small
// icon (with a title/aria-label) alongside that same color, so the signal
// doesn't depend on color perception.
export default function RowStatusIcon({
	isPending,
	isUnpaid,
}: {
	isPending: boolean;
	isUnpaid: boolean;
}) {
	if (isPending) {
		return (
			<i
				className="fa-solid fa-hourglass-half text-warning text-xs ml-1.5"
				title="Pending"
				aria-label="Pending"
			></i>
		);
	}
	if (isUnpaid) {
		return (
			<i
				className="fa-solid fa-circle-exclamation text-error text-xs ml-1.5"
				title="Unpaid"
				aria-label="Unpaid"
			></i>
		);
	}
	return null;
}

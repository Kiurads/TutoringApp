"use client";

export default function PrintButton() {
	return (
		<button onClick={() => window.print()} className="btn btn-primary btn-sm">
			<i className="fa-solid fa-print" /> Print / Save as PDF
		</button>
	);
}

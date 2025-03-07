"use client";

import { useEffect, useState } from "react";

export default function FirstVisitWarning() {
	const [isFirstVisit, setIsFirstVisit] = useState(false);

	useEffect(() => {
		// Check if the user has dismissed the warning
		const hasDismissedWarning = localStorage.getItem("hasDismissedWarning");

		if (hasDismissedWarning !== "true") {
			setIsFirstVisit(true);
		}
	}, []);

	const closeWarning = () => {
		setIsFirstVisit(false);
		localStorage.setItem("hasDismissedWarning", "true"); // Mark the warning as dismissed
	};

	return (
		<div>
			{/* Display warning only on the first visit, unless dismissed */}
			{isFirstVisit && (
				<div className="alert alert-warning flex justify-between items-center mb-4">
					<span>
						Attention! Classes that are not paid for by the last day
						before the class are automatically cancelled!
					</span>
					<button
						onClick={closeWarning}
						className="btn btn-sm btn-ghost"
					>
						Close
					</button>
				</div>
			)}
		</div>
	);
}

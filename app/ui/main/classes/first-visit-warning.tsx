"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function FirstVisitWarning() {
	const t = useTranslations("FirstVisitWarning");
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
						{t("warning")}
					</span>
					<button
						onClick={closeWarning}
						className="btn btn-sm btn-ghost"
					>
						{t("close")}
					</button>
				</div>
			)}
		</div>
	);
}

"use client";

import { redirect } from "next/navigation";

export default function GoBackButton(props: { url: string }) {
	return (
		<button
			className="btn btn-secondary flex-grow"
			onClick={() => redirect(props.url)}
		>
			Go Back
		</button>
	);
}

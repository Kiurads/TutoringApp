"use client";

import { redirect } from "next/navigation";

export default function GoBackButton(props: { url: string }) {
	return (
		<button
			className="btn btn-neutral flex-grow"
			onClick={() => redirect(props.url)}
		>
			Go Back
		</button>
	);
}

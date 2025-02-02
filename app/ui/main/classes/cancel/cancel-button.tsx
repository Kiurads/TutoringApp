"use client";

import { cancelClassById } from "@/app/lib/actions/classes.actions";

export default function CancelButton(props: { id: string }) {
	return (
		<button
			className="btn btn-error flex-grow"
			onClick={() => cancelClassById(props.id)}
		>
			Confirm
		</button>
	);
}

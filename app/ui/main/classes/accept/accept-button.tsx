"use client";

import { acceptClassById } from "@/app/lib/actions/classes.actions";

export default function AcceptButton(props: { id: string }) {
	return (
		<button
			className="btn btn-success flex-grow"
			onClick={() => acceptClassById(props.id)}
		>
			Accept
		</button>
	);
}

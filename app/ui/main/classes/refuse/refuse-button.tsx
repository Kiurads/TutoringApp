"use client";

import { refuseClassById } from "@/app/lib/actions/classes.actions";

export default function RefuseButton(props: { id: string }) {
	return (
		<button
			className="btn btn-error flex-grow"
			onClick={() => refuseClassById(props.id)}
		>
			Refuse
		</button>
	);
}

"use client";

import deleteTeacherById from "@/app/lib/actions/teachers/delete-teacher";

export default function DeleteTeacherButton(props: { id: string }) {
	return (
		<button
			className="btn btn-error flex-grow"
			onClick={() => deleteTeacherById(props.id)}
		>
			Confirm
		</button>
	);
}

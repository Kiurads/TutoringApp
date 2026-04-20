"use client";

import { BookedClass } from "@/app/lib/types/classes.types";
import ClassActionModals from "@/app/ui/main/classes/details/class-action-modals";

export default function ClassesTableButtons({
	bookedClass,
}: {
	bookedClass: BookedClass;
}) {
	const { status, requestedBySelf } = bookedClass;

	const canAccept = status === "requested" && !requestedBySelf;
	const canRefuse = status === "requested" && !requestedBySelf;
	const canCancel =
		(status === "requested" && requestedBySelf) || status === "scheduled";

	if (!canAccept && !canRefuse && !canCancel) return null;

	return (
		<ClassActionModals
			id={bookedClass.id}
			subject={bookedClass.subject.name}
			otherPartyName={bookedClass.student.name}
			role="teacher"
			canAccept={canAccept}
			canRefuse={canRefuse}
			canCancel={canCancel}
		/>
	);
}

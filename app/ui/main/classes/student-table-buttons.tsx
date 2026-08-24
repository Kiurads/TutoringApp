"use client";

import { useTranslations } from "next-intl";
import { BookedClass } from "@/app/lib/types/classes.types";
import { canPayForClass } from "@/app/lib/classes/can-pay-for-class";
import ClassActionModals from "@/app/ui/main/classes/details/class-action-modals";

export default function ClassesTableButtons({
	bookedClass,
}: {
	bookedClass: BookedClass;
}) {
	const t = useTranslations("StudentTableButtons");
	const { status, paid, requestedBySelf } = bookedClass;

	const canAccept = status === "requested" && !requestedBySelf;
	const canRefuse = status === "requested" && !requestedBySelf;
	const canCancel =
		(status === "requested" && requestedBySelf) || status === "scheduled";
	const canPay = canPayForClass(bookedClass);

	if (!canAccept && !canRefuse && !canCancel && !canPay) return null;

	return (
		<ClassActionModals
			id={bookedClass.id}
			subject={bookedClass.subject.name}
			otherPartyName={bookedClass.teacher?.name ?? t("theTeacher")}
			role="student"
			canAccept={canAccept}
			canRefuse={canRefuse}
			canCancel={canCancel}
			canPay={canPay}
			isPaid={paid}
			totalPrice={bookedClass.totalPrice}
		/>
	);
}

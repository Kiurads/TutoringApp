"use client";

import { useActionState, useEffect, useState } from "react";
import { requestRegularClass } from "@/app/lib/actions/regular-classes.actions";
import {
	getPaymentMethodStatus,
	saveDefaultPaymentMethod,
} from "@/app/lib/actions/payment-methods.actions";
import { fetchSubjectsWithTeachers } from "@/app/lib/actions/subjects.actions";
import { fetchTeachersBySubjectsId } from "@/app/lib/actions/teachers.actions";
import type { TeacherDetails } from "@/app/lib/types/teachers.types";
import SubjectSelect from "@/app/ui/main/classes/create/student/subject-select";
import TeacherSelect from "@/app/ui/main/classes/create/student/teacher-select";
import DurationSelect from "@/app/ui/main/classes/create/student/duration-select";
import DayOfWeekSelect from "./day-of-week-select";
import GoBackButton from "@/app/ui/go-back-button";
import SetupCardForm from "@/app/ui/payment/setup-card-form";

const DURATIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25);

type Phase = "details" | "payment";

export default function RequestRegularClassForm() {
	const [state, formAction, isPending] = useActionState(requestRegularClass, undefined);

	const [phase, setPhase] = useState<Phase>("details");
	const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [cardError, setCardError] = useState<string | null>(null);

	const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedDay, setSelectedDay] = useState<number | null>(null);
	const [teachers, setTeachers] = useState<TeacherDetails[]>([]);
	const [selectedTeacherId, setSelectedTeacherId] = useState("");

	// Kept as a real <form> ref so the payment step can trigger the same
	// action-bound submission once a card is on file.
	const [formEl, setFormEl] = useState<HTMLFormElement | null>(null);

	useEffect(() => {
		fetchSubjectsWithTeachers().then(setSubjects);
		getPaymentMethodStatus().then((s) => setHasPaymentMethod(s.hasPaymentMethod));
	}, []);

	useEffect(() => {
		if (!selectedSubject) {
			setTeachers([]);
			return;
		}
		setSelectedTeacherId("");
		fetchTeachersBySubjectsId([selectedSubject]).then(setTeachers);
	}, [selectedSubject]);

	async function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
		if (hasPaymentMethod) return; // let the form submit normally via `action`
		e.preventDefault();
		setCardError(null);
		setFormEl(e.currentTarget);

		const res = await fetch("/api/setup-intent", { method: "POST" });
		const json = await res.json();
		if (json.error) {
			setCardError(json.error);
			return;
		}
		setClientSecret(json.clientSecret);
		setPhase("payment");
	}

	async function handleCardSaved(setupIntentId: string) {
		const result = await saveDefaultPaymentMethod(setupIntentId);
		if (result.error) {
			setCardError(result.error);
			return;
		}
		setHasPaymentMethod(true);
		formEl?.requestSubmit();
	}

	if (phase === "payment" && clientSecret) {
		return (
			<div className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300">
				<h2 className="text-xl font-semibold text-center mb-2">Add a Payment Method</h2>
				<p className="text-sm text-base-content/60 text-center mb-6">
					Recurring classes are charged automatically each week — add a card once to
					finish your request.
				</p>
				{cardError && (
					<div role="alert" className="alert alert-error text-sm mb-4">
						<i className="fa-solid fa-triangle-exclamation shrink-0" />
						<span>{cardError}</span>
					</div>
				)}
				<SetupCardForm
					clientSecret={clientSecret}
					onSaved={handleCardSaved}
					onBack={() => setPhase("details")}
					submitLabel="Save Card & Send Request"
				/>
			</div>
		);
	}

	return (
		<form
			action={formAction}
			onSubmit={handleDetailsSubmit}
			className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300 flex flex-col gap-5"
		>
			<h2 className="text-xl font-semibold text-center">Request a Recurring Class</h2>
			<p className="text-sm text-base-content/60 text-center -mt-3">
				Pick a weekly slot. The teacher reviews it once — if accepted, sessions repeat
				automatically every week.
			</p>

			{(state || cardError) && (
				<div role="alert" className="alert alert-error text-sm">
					<i className="fa-solid fa-triangle-exclamation shrink-0" />
					<span>{state || cardError}</span>
				</div>
			)}

			<SubjectSelect
				subjects={subjects}
				selectedSubject={selectedSubject}
				onSelectSubject={setSelectedSubject}
			/>

			<DayOfWeekSelect selectedDay={selectedDay} onSelectDay={setSelectedDay} />

			<div className="flex flex-col gap-1.5">
				<label htmlFor="Time" className="text-sm font-medium">Time</label>
				<input
					type="time"
					id="Time"
					name="time"
					required
					className="input input-bordered w-full"
				/>
			</div>

			{selectedSubject && (
				<TeacherSelect
					teachers={teachers}
					selectedSubject={selectedSubject}
					selectedTeacherId={selectedTeacherId}
					onSelectTeacher={(id) => setSelectedTeacherId(id)}
				/>
			)}

			<DurationSelect durations={DURATIONS} />

			<div className="flex items-center gap-4 mt-2">
				<button
					type="submit"
					className="btn btn-primary flex-grow gap-2"
					disabled={isPending || hasPaymentMethod === null}
				>
					{isPending ? (
						<span className="loading loading-spinner loading-sm" />
					) : (
						<>
							<i className="fa-solid fa-arrow-right" />
							{hasPaymentMethod ? "Send Request" : "Continue to Payment"}
						</>
					)}
				</button>
				<GoBackButton url="/main/student/regular-classes" />
			</div>
		</form>
	);
}

"use client";

import { createSubject } from "@/app/lib/subjects/create-subject";
import { useActionState } from "react";

export default function CreateSubjectForm() {
	const [errorMessage, formAction, isPending] = useActionState(
		createSubject,
		undefined
	);

	return (
		<form
			action={formAction}
			className="space-y-4 bg-base-200 p-6 rounded-lg shadow"
		>
			{errorMessage && (
				<div role="alert" className="alert alert-error">
					<span>{errorMessage}</span>
				</div>
			)}

			<div className="form-control">
				<label className="label font-semibold">Subject Name</label>
				<input
					type="text"
					id="name"
					name="name"
					className="input input-bordered"
					required
				/>
			</div>

			<button
				type="submit"
				className="btn btn-primary w-full"
				aria-disabled={isPending}
			>
				Save Subject
			</button>
		</form>
	);
}

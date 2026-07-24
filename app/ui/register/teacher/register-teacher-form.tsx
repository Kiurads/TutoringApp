"use client";

import { useActionState } from "react";
import { registerTeacher } from "@/app/lib/auth/register-teacher";
import { SubjectData } from "@/app/lib/types/subjects.types";
import SubjectSelect from "./subject-select";

export default function RegisterTeacherForm({
	subjects,
}: {
	subjects: SubjectData[];
}) {
	const [errorMessage, formAction, isPending] = useActionState(
		registerTeacher,
		undefined
	);

	return (
		<form action={formAction} className="card-body">
			<div className="text-center pb-4 lg:text-center">
				<h2 className="text-xl font-bold">Create Teacher Account</h2>
			</div>

			{errorMessage && (
				<div role="alert" className="alert alert-error">
					<span>{errorMessage}</span>
				</div>
			)}

			{/* First Name */}
			<div className="form-control">
				<label htmlFor="firstName" className="label">
					<span className="label-text">First Name</span>
				</label>
				<input
					type="text"
					id="firstName"
					name="firstName"
					required
					className="input input-bordered"
				/>
			</div>

			{/* Last Name */}
			<div className="form-control">
				<label htmlFor="lastName" className="label">
					<span className="label-text">Last Name</span>
				</label>
				<input
					type="text"
					id="lastName"
					name="lastName"
					required
					className="input input-bordered"
				/>
			</div>

			{/* Phone Number */}
			<div className="form-control">
				<label htmlFor="phoneNumber" className="label">
					<span className="label-text">Phone Number (optional)</span>
				</label>
				<input
					type="text"
					id="phoneNumber"
					name="phoneNumber"
					className="input input-bordered"
				/>
			</div>

			{/* Email */}
			<div className="form-control">
				<label htmlFor="email" className="label">
					<span className="label-text">Email</span>
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					className="input input-bordered"
				/>
			</div>

			{/* Password */}
			<div className="form-control">
				<label htmlFor="password" className="label">
					<span className="label-text">Password</span>
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					className="input input-bordered"
				/>
			</div>

			{/* Confirm Password */}
			<div className="form-control">
				<label htmlFor="confirmPassword" className="label">
					<span className="label-text">Confirm Password</span>
				</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					className="input input-bordered"
				/>
			</div>

			{/* Subjects */}
			<SubjectSelect subjects={subjects} />

			{/* Terms & Conditions */}
			<div className="form-control">
				<label htmlFor="agreedToTerms" className="label cursor-pointer justify-start gap-3">
					<input
						type="checkbox"
						id="agreedToTerms"
						name="agreedToTerms"
						required
						className="checkbox checkbox-sm"
					/>
					<span className="label-text text-sm text-base-content/60">
						I agree to the{" "}
						<a
							href="/terms-of-service"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							terms and conditions
						</a>{" "}
						and{" "}
						<a
							href="/privacy-policy"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							privacy policy
						</a>
						.
					</span>
				</label>
			</div>

			{/* Submit */}
			<div className="mt-4">
				<button
					type="submit"
					className="btn btn-primary w-full"
					disabled={isPending}
				>
					{isPending ? <span className="loading loading-spinner loading-sm"></span> : "Create Teacher"}
				</button>
			</div>
		</form>
	);
}

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
					<span className="label-text">Phone Number</span>
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

			{/* Subjects */}
			<SubjectSelect subjects={subjects} />

			{/* Submit */}
			<div className="mt-4">
				<button
					className="btn btn-primary w-full"
					aria-disabled={isPending}
				>
					Create Teacher
				</button>
			</div>
		</form>
	);
}

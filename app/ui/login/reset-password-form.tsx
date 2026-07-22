"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/lib/auth/reset-password";
import Logo from "@/app/ui/logo";

export default function ResetPasswordForm({ token }: { token: string }) {
	const [errorMessage, formAction, isPending] = useActionState(
		resetPassword,
		undefined
	);

	return (
		<form action={formAction} className="card-body">
			<div className="flex justify-center pb-4">
				<Logo />
			</div>
			<input type="hidden" name="token" value={token} />
			{errorMessage && (
				<div role="alert" className="alert alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{errorMessage}</span>
				</div>
			)}
			<div className="form-control">
				<label htmlFor="Password" className="label">
					<span className="label-text">New password</span>
				</label>

				<input
					type="password"
					id="Password"
					name="password"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="form-control">
				<label htmlFor="ConfirmPassword" className="label">
					<span className="label-text">Confirm new password</span>
				</label>

				<input
					type="password"
					id="ConfirmPassword"
					name="confirmPassword"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="pt-2 col-span-6 flex items-center gap-4">
				<button type="submit" className="grow btn btn-primary" disabled={isPending}>
					{isPending ? <span className="loading loading-spinner loading-sm"></span> : "Reset password"}
				</button>
			</div>
		</form>
	);
}

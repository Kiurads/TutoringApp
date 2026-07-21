"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/lib/auth/request-password-reset";
import Logo from "@/app/ui/logo";

export default function ForgotPasswordForm() {
	const [message, formAction, isPending] = useActionState(
		requestPasswordReset,
		undefined
	);

	return (
		<form action={formAction} className="card-body">
			<div className="flex justify-center pb-4">
				<Logo />
			</div>
			<p className="text-sm text-base-content/60">
				Enter your email and we&apos;ll send you a link to reset your
				password.
			</p>
			{message && (
				<div role="alert" className="alert alert-info">
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
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{message}</span>
				</div>
			)}
			<div className="form-control">
				<label htmlFor="Email" className="label">
					<span className="label-text">Email</span>
				</label>

				<input
					type="email"
					id="Email"
					name="email"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="pt-2 col-span-6 flex items-center gap-4">
				<button className="grow btn btn-primary" aria-disabled={isPending}>
					Send reset link
				</button>
			</div>

			<p className="mt-2 text-sm text-base-content/60">
				<Link href="/login" className="text-base-content underline">
					Back to login
				</Link>
			</p>
		</form>
	);
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "@/app/lib/auth/authenticate";
import Logo from "@/app/ui/logo";

export default function LoginForm() {
	const [errorMessage, formAction, isPending] = useActionState(
		authenticate,
		undefined
	);

	return (
		<form action={formAction} className="card-body">
			<div className="flex justify-center pb-4">
				<Logo />
			</div>
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

			<div className="form-control">
				<label htmlFor="Password" className="label">
					<span className="label-text">Password</span>
				</label>

				<input
					type="password"
					id="Password"
					name="password"
					placeholder="Password"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="flex justify-end">
				<Link
					href="/forgot-password"
					className="label-text-alt link link-hover"
				>
					Forgot password?
				</Link>
			</div>

			<div className="pt-2 col-span-6 flex items-center gap-4">
				<button
					type="submit"
					className="grow btn btn-primary"
					disabled={isPending}
				>
					{isPending ? <span className="loading loading-spinner loading-sm"></span> : "Login"}
				</button>
			</div>
		</form>
	);
}

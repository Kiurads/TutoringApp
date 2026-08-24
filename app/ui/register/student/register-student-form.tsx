"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerStudent } from "@/app/lib/auth/register-student";
import Logo from "@/app/ui/logo";

export default function RegisterStudentForm() {
	const t = useTranslations("RegisterStudentForm");
	const [errorMessage, formAction, isPending] = useActionState(
		registerStudent,
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
				<label htmlFor="FirstName" className="label">
					<span className="label-text">{t("firstName")}</span>
				</label>

				<input
					type="text"
					id="FirstName"
					name="firstName"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="form-control">
				<label htmlFor="LastName" className="label">
					<span className="label-text">{t("lastName")}</span>
				</label>

				<input
					type="text"
					id="LastName"
					name="lastName"
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="form-control">
				<label htmlFor="PhoneNumber" className="label">
					<span className="label-text">{t("phoneNumber")}</span>
				</label>

				<input
					type="text"
					id="PhoneNumber"
					name="phoneNumber"
					className="input input-bordered"
				/>
			</div>

			<div className="form-control">
				<label htmlFor="Email" className="label">
					<span className="label-text">{t("email")}</span>
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
					<span className="label-text">{t("password")}</span>
				</label>

				<input
					type="password"
					id="Password"
					name="password"
					placeholder={t("password")}
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="form-control">
				<label htmlFor="ConfirmPassword" className="label">
					<span className="label-text">{t("confirmPassword")}</span>
				</label>

				<input
					type="password"
					id="ConfirmPassword"
					name="confirmPassword"
					placeholder={t("confirmPassword")}
					required
					className="input input-bordered validator"
				/>
			</div>

			<div className="col-span-6 form-control">
				<label htmlFor="AgreedToTerms" className="label cursor-pointer justify-start gap-3">
					<input
						type="checkbox"
						id="AgreedToTerms"
						name="agreedToTerms"
						required
						className="checkbox checkbox-sm"
					/>
					<span className="label-text text-sm text-base-content/60">
						{t.rich("agreeToTerms", {
							terms: (chunks) => (
								<a
									href="/terms-of-service"
									target="_blank"
									rel="noopener noreferrer"
									className="text-base-content underline"
								>
									{chunks}
								</a>
							),
							privacy: (chunks) => (
								<a
									href="/privacy-policy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-base-content underline"
								>
									{chunks}
								</a>
							),
						})}
					</span>
				</label>
			</div>

			<div className="col-span-6 sm:flex sm:items-center sm:gap-4">
				<button type="submit" className="btn btn-primary" disabled={isPending}>
					{isPending ? <span className="loading loading-spinner loading-sm"></span> : t("submit")}
				</button>

				<p className="mt-4 text-sm text-base-content/60 sm:mt-0">
					{t("alreadyHaveAccount")}{" "}
					<Link href="/login" className="text-base-content underline">
						{t("logIn")}
					</Link>
					.
				</p>
			</div>
		</form>
	);
}

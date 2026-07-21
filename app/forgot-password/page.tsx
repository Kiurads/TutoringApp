"use client";

import ForgotPasswordForm from "@/app/ui/login/forgot-password-form";

export default function ForgotPassword() {
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<ForgotPasswordForm />
				</div>
			</div>
		</div>
	);
}

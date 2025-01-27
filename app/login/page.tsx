"use client";

import LoginForm from "@/app/ui/login/login-form";

export default function SignIn() {
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}

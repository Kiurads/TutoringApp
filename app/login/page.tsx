"use client";

import { useActionState } from "react";

import { authenticate } from "@/app/lib/auth/authenticate";

export default function SignIn() {
	const [errorMessage, formAction, isPending] = useActionState(
		authenticate,
		undefined
	);

	return (
		<form action={formAction}>
			{errorMessage && <div>{errorMessage}</div>}
			<label>
				Email
				<input name="email" type="email" />
			</label>
			<label>
				Password
				<input name="password" type="password" />
			</label>
			<button aria-disabled={isPending}>Sign In</button>
		</form>
	);
}

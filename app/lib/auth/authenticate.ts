"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function authenticate(
	prevState: string | undefined,
	formData: FormData
) {
	try {
		await signIn("credentials", formData);
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "Invalid credentials.";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}

	// Redirect to "/" and let auth.config.ts's `authorized()` callback route
	// the now-logged-in user to their role's dashboard. "/dashboard" isn't a
	// real route in this app — don't duplicate the role→path mapping here.
	redirect("/");
}

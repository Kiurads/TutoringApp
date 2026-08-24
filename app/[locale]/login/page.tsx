import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/app/ui/login/login-form";

export const metadata: Metadata = {
	title: "Log In",
	description: "Log in to Ponte to book, manage, and track your tutoring sessions.",
};

interface LoginPageProps {
	searchParams: Promise<{ verify?: string; reset?: string; passwordChanged?: string }>;
}

const VERIFY_MESSAGE_KEYS: Record<string, string> = {
	success: "verifySuccess",
	"missing-token": "verifyMissingToken",
	"invalid-token": "verifyInvalidToken",
	"expired-token": "verifyExpiredToken",
	"user-not-found": "verifyUserNotFound",
};

// Server component (not "use client") so it can read searchParams directly
// without needing a useSearchParams()/Suspense dance — LoginForm itself is
// still a client component and works fine nested here.
export default async function SignIn({ searchParams }: LoginPageProps) {
	const [{ verify, reset, passwordChanged }, t] = await Promise.all([
		searchParams,
		getTranslations("LoginPage"),
	]);
	const verifyMessageKey = verify ? VERIFY_MESSAGE_KEYS[verify] : undefined;
	const isVerifySuccess = verify === "success";

	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					{verifyMessageKey && (
						<div
							className={`alert ${
								isVerifySuccess ? "alert-success" : "alert-error"
							} m-4 mb-0`}
						>
							<span>{t(verifyMessageKey)}</span>
						</div>
					)}
					{reset === "success" && (
						<div className="alert alert-success m-4 mb-0">
							<span>{t("resetSuccess")}</span>
						</div>
					)}
					{passwordChanged === "true" && (
						<div className="alert alert-success m-4 mb-0">
							<span>{t("passwordChanged")}</span>
						</div>
					)}
					<LoginForm />
				</div>
			</div>
		</div>
	);
}

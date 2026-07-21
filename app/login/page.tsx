import LoginForm from "@/app/ui/login/login-form";

interface LoginPageProps {
	searchParams: Promise<{ verify?: string; reset?: string }>;
}

const VERIFY_MESSAGES: Record<string, string> = {
	success: "Your email has been verified. You can now log in.",
	"missing-token": "That verification link is missing its token.",
	"invalid-token":
		"That verification link is invalid or has already been used.",
	"expired-token": "That verification link has expired.",
	"user-not-found": "We couldn't find an account for that verification link.",
};

// Server component (not "use client") so it can read searchParams directly
// without needing a useSearchParams()/Suspense dance — LoginForm itself is
// still a client component and works fine nested here.
export default async function SignIn({ searchParams }: LoginPageProps) {
	const { verify, reset } = await searchParams;
	const verifyMessage = verify ? VERIFY_MESSAGES[verify] : undefined;
	const isVerifySuccess = verify === "success";

	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					{verifyMessage && (
						<div
							className={`alert ${
								isVerifySuccess ? "alert-success" : "alert-error"
							} m-4 mb-0`}
						>
							<span>{verifyMessage}</span>
						</div>
					)}
					{reset === "success" && (
						<div className="alert alert-success m-4 mb-0">
							<span>
								Your password has been reset. You can now log in.
							</span>
						</div>
					)}
					<LoginForm />
				</div>
			</div>
		</div>
	);
}

import Link from "next/link";
import ResetPasswordForm from "@/app/ui/login/reset-password-form";

interface ResetPasswordPageProps {
	searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
	searchParams,
}: ResetPasswordPageProps) {
	const { token } = await searchParams;

	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					{token ? (
						<ResetPasswordForm token={token} />
					) : (
						<div className="card-body items-center text-center gap-4">
							<h1 className="text-xl font-bold">Invalid reset link</h1>
							<p className="text-base-content/70">
								This password reset link is missing or malformed. Please
								request a new one.
							</p>
							<Link href="/forgot-password" className="btn btn-primary w-full">
								Request a new link
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

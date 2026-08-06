import SignOutForm from "@/app/ui/signout/signout-form";

export default function SignOutPage() {
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col lg:flex-row">
				<div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
					<SignOutForm />
				</div>
			</div>
		</div>
	);
}

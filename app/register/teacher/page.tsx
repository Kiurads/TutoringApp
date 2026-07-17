import Link from "next/link";

export default function TeacherRegisterPage() {
	return (
		<div className="hero bg-base-200 min-h-screen">
			<div className="hero-content flex-col max-w-md text-center">
				<div className="bg-primary text-primary-content p-4 rounded-full mb-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-10 w-10"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				</div>
				<h1 className="text-3xl font-bold">Teacher Accounts</h1>
				<p className="text-base-content/70 mt-2">
					Teacher accounts are created by administrators. If you are a
					teacher and need an account, please contact your administrator.
				</p>
				<div className="flex flex-col gap-3 mt-6 w-full">
					<Link href="/login" className="btn btn-primary w-full">
						Log in
					</Link>
					<Link href="/register/student" className="btn btn-ghost w-full">
						Sign up as a student
					</Link>
				</div>
			</div>
		</div>
	);
}

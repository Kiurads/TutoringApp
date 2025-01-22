import Link from "next/link";

export default function Hero() {
	return (
		<section className="bg-base-200 text-base-content">
			<div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:items-center">
				<div className="mx-auto max-w-3xl text-center">
					<h1 className="bg-gradient-to-r from-primary via-accent to-secondary py-2 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl bg-300% animate-gradient">
						Connecting Minds.
						<span className="sm:block"> Empowering Futures. </span>
					</h1>

					<p className="mx-auto mt-4 max-w-xl sm:text-xl/relaxed">
						Unlock your full potential with personalized learning!
						Find expert teachers in a variety of subjects, book
						classes that fit your schedule, and learn at your own
						pace. Join today and take the first step toward
						achieving your goals!
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-4">
						<Link
							className="btn btn-primary px-9 py-3"
							href="/register/student"
						>
							<i className="fa-solid fa-user-plus text-l"></i>
							Register
						</Link>

						<Link
							className="btn btn-outline px-12 py-3"
							href="/login"
						>
							<i className="fa-solid fa-user text-l"></i>
							Login
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

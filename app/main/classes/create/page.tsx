import Link from "next/link";

export default function ClassesPage() {
	return (
		<div className="flex justify-center items-center min-h-screen p-4">
			<div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
				<div className="w-full md:w-1/2">
					<Link
						href="/main/classes/create/noteacher"
						className="btn btn-primary w-full h-36 shadow-xl"
					>
						<div className="card-body items-center text-center text-primary-content">
							<h2 className="card-title font-bold text-2xl md:text-3xl">
								You Choose
							</h2>
							<p className="text-sm md:text-base">
								You can choose the teacher by your subject of
								interest
							</p>
						</div>
					</Link>
				</div>
				<div className="w-full md:w-1/2">
					<Link
						href=""
						className="btn btn-secondary w-full h-36 shadow-xl"
					>
						<div className="card-body items-center text-center text-secondary-content">
							<h2 className="card-title font-bold text-2xl md:text-3xl">
								We Choose
							</h2>
							<p className="text-sm md:text-base">
								You request a class by subject and a teacher can
								pick it
							</p>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

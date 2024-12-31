import Hero from "./ui/hero";
import Opinions from "./ui/opinions";

export default function Home() {
	return (
		<div className="min-h-screen">
			<div className="flex-col items-center justify-center min-h-screen">
				<Hero />
				<h1 className="text-center font-bold text-5xl bg-base-100">
					Some <span className="text-accent">feedback</span> from our
					students
				</h1>
				<div className="flex-row">
					<Opinions />
				</div>
			</div>
		</div>
	);
}

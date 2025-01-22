import Hero from "./ui/hero";
import Opinions from "./ui/opinions";

export default function Home() {
	return (
		<div className="min-h-screen">
			<div className="flex-col items-center justify-center min-h-screen">
				<Hero />
				<div className="flex-row">
					<Opinions />
				</div>
			</div>
		</div>
	);
}

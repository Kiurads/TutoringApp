export default function Logo() {
	return (
		<span className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
			<span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-content text-sm">
				<i className="fa-solid fa-graduation-cap" />
			</span>
			<span>
				The Learning{" "}
				<span className="text-primary">Nexus</span>
			</span>
		</span>
	);
}

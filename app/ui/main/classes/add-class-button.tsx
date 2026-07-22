import Link from "next/link";

export default function AddClassButton() {
	return (
		<Link
			href="/main/student/classes/request"
			aria-label="New Class"
			className="btn btn-primary flex items-center gap-2 px-4 py-2"
		>
			<i className="fa-solid fa-calendar-plus text-primary-content"></i>
			<span className="hidden text-primary-content md:inline">
				New Class
			</span>
		</Link>
	);
}

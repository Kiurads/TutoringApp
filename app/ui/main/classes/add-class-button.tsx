import Link from "next/link";

export default function AddClassButton() {
	return (
		<Link
			href="/main/classes/request"
			className="btn btn-primary absolute top-6 right-6"
		>
			<span className="hidden text-primary-content md:block">
				New Class{" "}
			</span>
			<i className="fa-solid fa-calendar-plus text-primary-content"></i>
		</Link>
	);
}

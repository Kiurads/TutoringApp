import { fetchClassRequestedBySelf } from "@/app/lib/actions/classes.actions";
import Link from "next/link";

export default async function ClassesTableButtons(props: {
	classId: string;
	classStatus: string;
}) {
	const requestedBySelf = await fetchClassRequestedBySelf(props.classId);

	if (requestedBySelf) {
		return (
			<div className="flex flex-row gap-2">
				<Link
					href={`/main/classes/${props.classId}`}
					className="btn btn-info btn-sm basis-1/2"
				>
					<i className="fa-solid fa-info"></i>
				</Link>
				<Link
					href={`/main/classes/${props.classId}/cancel`}
					className="btn btn-error btn-sm basis-1/2"
				>
					<i className="fa-solid fa-trash"></i>
				</Link>
			</div>
		);
	} else {
		if (props.classStatus === "requested") {
			return (
				<div className="flex flex-row gap-2">
					<Link
						href={`/main/classes/${props.classId}/accept`}
						className="btn btn-success btn-sm basis-1/2"
					>
						<i className="fa-solid fa-check"></i>
					</Link>
					<Link
						href={`/main/classes/${props.classId}/refuse`}
						className="btn btn-error btn-sm basis-1/2"
					>
						<i className="fa-solid fa-x"></i>
					</Link>
				</div>
			);
		}

		return (
			<div className="flex flex-row gap-2">
				<Link
					href={`/main/classes/${props.classId}`}
					className="btn btn-info btn-sm basis-1/2"
				>
					<i className="fa-solid fa-info"></i>
				</Link>
			</div>
		);
	}
}

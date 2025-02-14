import { fetchClassById } from "@/app/lib/actions/classes.actions";
import GoBackButton from "@/app/ui/go-back-button";
import AcceptButton from "@/app/ui/main/classes/accept/accept-button";

export default async function CancelBookingPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const classId = params.id;
	const classData = await fetchClassById(classId);

	return (
		<div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mt-10">
			<h2 className="text-lg font-bold text-center">Accept Request</h2>
			{classData && (
				<p className="text-center mt-2">
					Are you sure you want to accept{" "}
					<strong>{classData.subject.name}</strong> class with{" "}
					<strong>
						{classData.teacher.user.firstName}{" "}
						{classData.teacher.user.lastName}
					</strong>
					?
				</p>
			)}
			<div className="col-span-6 mt-4 sm:flex sm:items-center sm:gap-4">
				<AcceptButton id={classId} />
				<GoBackButton url="/main/classes" />
			</div>
		</div>
	);
}

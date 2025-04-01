import { ClassDataCalendar } from "@/app/lib/actions/classes.actions";

export default function ClassCard(props: { classData: ClassDataCalendar }) {
	const { classData } = props;

	// Calculate the height of the class block based on the duration
	const blockHeight = classData.duration * 60; // Convert duration to minutes for block height
	const startTime = new Date(
		`1970-01-01T${classData.startTime}:00`
	).getHours(); // Get start time in hours (24-hour format)

	// Calculate the top position of the block based on the start time
	const topPosition = (startTime - 8) * 60; // Assuming classes start at 8 AM

	return (
		<div
			className="bg-blue-500 text-white p-2 mb-2 rounded-lg shadow-md"
			style={{
				height: `${blockHeight}px`,
				marginTop: `${topPosition}px`,
			}}
		>
			<h3 className="font-semibold text-lg">{classData.subject}</h3>
			<p>{classData.teacherName}</p>
			<p>{classData.studentName}</p>
			<p>{classData.status}</p>
			<p>{classData.startTime}</p>
		</div>
	);
}

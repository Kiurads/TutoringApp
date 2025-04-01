import { ClassDataCalendar } from "@/app/lib/actions/classes.actions";
import ClassCard from "./class-card";

export default function WeeklySchedule(props: {
	classDataList: ClassDataCalendar[];
}) {
	const { classDataList } = props;

	// Create an object with days as keys and classes as values
	const daysOfWeek = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday",
	];
	const schedule: { [key: string]: ClassDataCalendar[] } = {
		Monday: [],
		Tuesday: [],
		Wednesday: [],
		Thursday: [],
		Friday: [],
		Saturday: [],
		Sunday: [],
	};

	classDataList.forEach((classData) => {
		schedule[classData.day].push(classData);
	});

	// Create an array of hours from 8 AM to 10 PM (extended to include evening hours)
	const hoursOfDay = Array.from(
		{ length: 15 },
		(_, index) => `${8 + index}:00`
	);

	return (
		<div className="grid grid-cols-8 gap-4">
			{/* Hours column */}
			<div className="border p-4">
				{hoursOfDay.map((hour, index) => (
					<div key={index} className="text-center">
						{hour}
					</div>
				))}
			</div>

			{/* Days of the week */}
			{daysOfWeek.map((day) => (
				<div key={day} className="p-4 border relative">
					<h2 className="font-semibold text-xl mb-2 text-center">
						{day}
					</h2>
					<div className="absolute top-0 left-0 w-full h-full">
						{schedule[day].map((classData, index) => (
							<ClassCard key={index} classData={classData} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}

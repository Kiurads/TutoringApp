import { fetchClassBySelfCalendar } from "@/app/lib/actions/classes.actions";
import WeeklySchedule from "@/app/ui/main/calendar/weekly-schedule";

export default async function StudentCalendarPage() {
	const classes = await fetchClassBySelfCalendar() ?? [];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Calendar</h1>
				<p className="text-base-content/60 mt-1">
					Your weekly class schedule
				</p>
			</div>
			<WeeklySchedule classes={classes} basePath="/main/student" />
		</div>
	);
}

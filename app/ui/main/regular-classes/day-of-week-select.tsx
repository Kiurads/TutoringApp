import { FC } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayOfWeekSelectProps {
	selectedDay: number | null;
	onSelectDay: (day: number) => void;
}

const DayOfWeekSelect: FC<DayOfWeekSelectProps> = ({ selectedDay, onSelectDay }) => (
	<div className="flex flex-col gap-1.5">
		<label className="text-sm font-medium">Day of the week</label>
		<input type="hidden" name="dayOfWeek" value={selectedDay ?? ""} />
		<div className="grid grid-cols-7 gap-2">
			{DAYS.map((label, day) => (
				<button
					key={day}
					type="button"
					className={`btn btn-sm w-full transition-all ${
						selectedDay === day ? "btn-primary" : "btn-outline btn-primary"
					}`}
					onClick={() => onSelectDay(day)}
				>
					{label}
				</button>
			))}
		</div>
	</div>
);

export default DayOfWeekSelect;

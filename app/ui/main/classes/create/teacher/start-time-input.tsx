import { FC } from "react";

interface StartTimeInputProps {
	minDate: string;
	defaultValue?: string;
}

const StartTimeInput: FC<StartTimeInputProps> = ({ minDate, defaultValue }) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor="StartTime" className="text-sm font-medium">Start Time</label>
		<input
			type="datetime-local"
			id="StartTime"
			name="startTime"
			required
			className="input input-bordered w-full"
			min={defaultValue ? undefined : minDate}
			defaultValue={defaultValue}
		/>
	</div>
);

export default StartTimeInput;

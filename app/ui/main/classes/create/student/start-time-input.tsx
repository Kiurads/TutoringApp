import { FC } from "react";

interface StartTimeInputProps {
	minDate: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
}

const StartTimeInput: FC<StartTimeInputProps> = ({ minDate, defaultValue, onChange }) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor="StartTime" className="text-sm font-medium">Start Time</label>
		<input
			type="datetime-local"
			id="StartTime"
			name="startTime"
			required
			className="input input-bordered w-full"
			// Only apply min when there's no pre-filled value — browsers clear the
			// field silently when defaultValue is earlier than min.
			min={defaultValue ? undefined : minDate}
			defaultValue={defaultValue}
			onChange={onChange ? (e) => onChange(e.target.value) : undefined}
		/>
	</div>
);

export default StartTimeInput;

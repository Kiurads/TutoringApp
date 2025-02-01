import { FC } from "react";

interface StartTimeInputProps {
	minDate: string;
}

const StartTimeInput: FC<StartTimeInputProps> = ({ minDate }) => (
	<div className="form-control">
		<label htmlFor="StartTime" className="label">
			<span className="label-text">Start Time</span>
		</label>
		<input
			type="datetime-local"
			id="StartTime"
			name="startTime"
			required
			className="input input-bordered"
			min={minDate}
		/>
	</div>
);

export default StartTimeInput;

import { FC } from "react";

interface DurationSelectProps {
	durations: number[];
}

const DurationSelect: FC<DurationSelectProps> = ({ durations }) => (
	<div className="form-control">
		<label htmlFor="Duration" className="label">
			<span className="label-text">Duration (hours)</span>
		</label>
		<select
			id="Duration"
			name="duration"
			required
			className="select select-bordered"
		>
			{durations.map((duration) => (
				<option key={duration} value={duration}>
					{duration} hours
				</option>
			))}
		</select>
	</div>
);

export default DurationSelect;

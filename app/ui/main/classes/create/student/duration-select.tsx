import { FC } from "react";

function formatDuration(hours: number): string {
	const totalMin = Math.round(hours * 60);
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	if (h === 0) return `${m} min`;
	if (m === 0) return `${h}h`;
	return `${h}h ${m}min`;
}

interface DurationSelectProps {
	durations: number[];
	defaultValue?: number;
	onChange?: (hours: number) => void;
}

const DurationSelect: FC<DurationSelectProps> = ({ durations, defaultValue, onChange }) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor="Duration" className="text-sm font-medium">Duration</label>
		<select
			id="Duration"
			name="duration"
			required
			className="select select-bordered w-full"
			defaultValue={defaultValue ?? durations[0]}
			onChange={onChange ? (e) => onChange(parseFloat(e.target.value)) : undefined}
		>
			{durations.map((d) => (
				<option key={d} value={d}>
					{formatDuration(d)}
				</option>
			))}
		</select>
	</div>
);

export default DurationSelect;

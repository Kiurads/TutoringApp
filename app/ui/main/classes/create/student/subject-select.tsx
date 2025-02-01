import { FC } from "react";

interface SubjectSelectProps {
	subjects: { id: string; name: string }[];
	selectedSubject: string;
	onSelectSubject: (subjectId: string) => void;
}

const SubjectSelect: FC<SubjectSelectProps> = ({
	subjects,
	selectedSubject,
	onSelectSubject,
}) => (
	<div className="form-control">
		<label htmlFor="Subject" className="label">
			<span className="label-text">Subject</span>
		</label>
		<select
			id="Subject"
			name="subject"
			required
			className="select select-bordered"
			value={selectedSubject}
			onChange={(e) => onSelectSubject(e.target.value)}
		>
			<option value="">Select a subject</option>
			{subjects.map((subject) => (
				<option key={subject.id} value={subject.id}>
					{subject.name}
				</option>
			))}
		</select>
	</div>
);

export default SubjectSelect;

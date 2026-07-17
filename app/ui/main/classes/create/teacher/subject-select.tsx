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
	<div className="flex flex-col gap-1.5">
		<label className="text-sm font-medium">Subject</label>
		<input type="hidden" name="subject" value={selectedSubject} />
		<div className="grid grid-cols-2 gap-2">
			{subjects.length === 0 && (
				<span className="col-span-2 text-sm text-base-content/50 italic">
					No subjects available
				</span>
			)}
			{subjects.map((subject) => (
				<button
					key={subject.id}
					type="button"
					className={`btn btn-sm w-full transition-all ${
						selectedSubject === subject.id
							? "btn-primary"
							: "btn-outline btn-primary"
					}`}
					onClick={() => onSelectSubject(subject.id)}
				>
					{subject.name}
				</button>
			))}
		</div>
	</div>
);

export default SubjectSelect;

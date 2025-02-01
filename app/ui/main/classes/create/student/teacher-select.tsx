import { FC } from "react";

interface TeacherSelectProps {
	teachers: { id: string; user: { firstName: string; lastName: string } }[];
	selectedSubject: string;
}

const TeacherSelect: FC<TeacherSelectProps> = ({
	teachers,
	selectedSubject,
}) => (
	<div className="form-control">
		<label htmlFor="Teacher" className="label">
			<span className="label-text">Teacher</span>
		</label>
		<select
			id="Teacher"
			name="teacher"
			required
			className="select select-bordered"
			disabled={!selectedSubject}
		>
			<option value="">Select a teacher</option>
			{teachers.map((teacher) => (
				<option key={teacher.id} value={teacher.id}>
					{teacher.user.firstName} {teacher.user.lastName}
				</option>
			))}
		</select>
	</div>
);

export default TeacherSelect;

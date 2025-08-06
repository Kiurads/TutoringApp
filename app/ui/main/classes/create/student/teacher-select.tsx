import UserDetails from "@/app/lib/types/user.types";
import { FC } from "react";

interface TeacherSelectProps {
	teachers: UserDetails[];
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
					{teacher.name}
				</option>
			))}
		</select>
	</div>
);

export default TeacherSelect;

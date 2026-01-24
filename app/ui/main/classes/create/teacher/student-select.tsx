import UserDetails from "@/app/lib/types/user.types";
import { FC } from "react";

interface StudentSelectProps {
	students: UserDetails[];
}

const StudentSelect: FC<StudentSelectProps> = ({ students }) => (
	<div className="form-control">
		<label htmlFor="Student" className="label">
			<span className="label-text">Student</span>
		</label>
		<select
			id="Student"
			name="student"
			required
			className="select select-bordered"
		>
			<option value="">Select a student</option>
			{students.map((student) => (
				<option key={student.id} value={student.id}>
					{student.name}
				</option>
			))}
		</select>
	</div>
);

export default StudentSelect;

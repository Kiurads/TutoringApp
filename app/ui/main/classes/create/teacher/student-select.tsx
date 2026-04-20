import UserDetails from "@/app/lib/types/user.types";
import { FC } from "react";

interface StudentSelectProps {
	students: UserDetails[];
}

const StudentSelect: FC<StudentSelectProps> = ({ students }) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor="Student" className="text-sm font-medium">Student</label>
		<select
			id="Student"
			name="student"
			required
			className="select select-bordered w-full"
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

import { fetchTeachersBySubjects } from "../utils/teachers.api";
import { fetchUsers } from "../utils/users.api";

export default async function UsersPage() {
	await fetchTeachersBySubjects(["biology"]);
	const users = await fetchUsers();

	if (!users) {
		return <div>Loading...</div>;
	}
	return (
		<div>
			{users.map((user, i) => (
				<div key={i}>
					<h2>
						{user.firstName} {user.lastName}
					</h2>
					<p>{user.role}</p>
				</div>
			))}
		</div>
	);
}

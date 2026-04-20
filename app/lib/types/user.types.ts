export default interface UserDetails {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface StudentDetails extends UserDetails {
	firstName: string;
	lastName: string;
	phoneNumber: string | null;
	avatarOptions?: string | null;
	activeFrame?: string | null;
}

export function formatUser(user: {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
}): UserDetails {
	return {
		id: user.id,
		name: `${user.firstName} ${user.lastName}`,
		email: user.email,
		role: user.role as "student" | "teacher" | "admin",
	};
}

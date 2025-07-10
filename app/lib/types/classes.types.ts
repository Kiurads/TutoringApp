import UserDetails from "./user.types";

export default interface ClassData {
	id: string;
	teacher: UserDetails;
	student: UserDetails;
	status: string;
	subject: string;
	requesterId: string;
	startTime: string;
	durationInHours: string;
	paid: boolean;
	totalPrice: string;
	createdAt: string;
}

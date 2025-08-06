import UserDetails from "./user.types";

export interface ClassData {
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

export interface ClassDataSimple {
	id: string;
	status: string;
	startTime: string;
	durationInHours: string;
	paid: boolean;
	totalPrice: string;
	createdAt: string;
}

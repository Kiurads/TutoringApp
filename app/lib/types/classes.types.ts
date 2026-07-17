import UserDetails from "./user.types";

export interface ClassData {
	id: string;
	teacher: UserDetails | null;
	student: UserDetails;
	status: string;
	subject: string;
	requesterId: string;
	startTime: string;
	durationInHours: string;
	paid: boolean;
	hasPreAuth: boolean;
	totalPrice: string;
	createdAt: string;
	counterOfferTime: string | null;
	jitsiRoom: string | null;
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

export interface BookedClass {
	id: string;
	durationInHours: string;
	startTime: Date;
	totalPrice: string;
	status: string;
	requestedBySelf: boolean;
	paid: boolean;
	student: {
		name: string;
	};
	teacher: {
		name: string;
	} | null;
	subject: {
		name: string;
	};
}

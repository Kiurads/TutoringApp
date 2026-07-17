export interface RegularClassData {
	id: string;
	status: string;
	dayOfWeek: number;
	/** "HH:MM" in local time — only the time-of-day portion of the underlying DateTime matters */
	startTime: string;
	durationInHours: string;
	totalPrice: string;
	subject: string;
	student: { id: string; name: string };
	teacher: { id: string; name: string };
	createdAt: string;
}

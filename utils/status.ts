export default class Status {
	success: boolean;
	message: string;

	constructor(success: boolean, message: string) {
		this.success = success;
		this.message = message;
	}

	static success(message: string = "Success"): Status {
		return new Status(true, message);
	}

	static error(message: string): Status {
		return new Status(false, message);
	}
}

import { redirect } from "next/navigation";

export async function createClass(
	prevState: string | undefined,
	formData: FormData
) {
	// Implement logic to create a new class
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const phoneNumber = formData.get("phoneNumber") as string;
	const firstName = formData.get("firstName") as string;
	const lastName = formData.get("lastName") as string;

	if (!email) {
		return "Please enter a valid email";
	}

	if (!password) {
		return "Please enter a valid password";
	}

	if (!firstName) {
		return "Please enter a valid first name";
	}

	if (!lastName) {
		return "Please enter a valid last name";
	}

	if (phoneNumber && /^\d{9}$/.test(phoneNumber) == false) {
		return "Please enter a valid email";
	}

	redirect("/login");
}

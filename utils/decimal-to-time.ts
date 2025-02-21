export function decimalToHours(decimal) {
	const hours = Math.floor(decimal);
	const minutes = Math.round((decimal - hours) * 60);

	// Format the hours and minutes to ensure two digits
	const formattedHours = hours.toString().padStart(2, "0");
	const formattedMinutes = minutes.toString().padStart(2, "0");

	return `${formattedHours}H${formattedMinutes}M`;
}

export function decimalStringToHours(decimalString: string) {
	// Convert the string to a number
	const decimal = parseFloat(decimalString);

	// Check if the conversion was successful
	if (isNaN(decimal)) {
		throw new Error(
			"Invalid input. Please provide a valid decimal number as a string."
		);
	}

	const hours = Math.floor(decimal);
	const minutes = Math.round((decimal - hours) * 60);

	// Format the hours and minutes to ensure two digits
	const formattedHours = hours.toString().padStart(2, "0");
	const formattedMinutes = minutes.toString().padStart(2, "0");

	return `${formattedHours}H${formattedMinutes}M`;
}

export default function decimalToHours(decimal) {
	const hours = Math.floor(decimal);
	const minutes = Math.round((decimal - hours) * 60);

	// Format the hours and minutes to ensure two digits
	const formattedHours = hours.toString().padStart(2, "0");
	const formattedMinutes = minutes.toString().padStart(2, "0");

	return `${formattedHours}H${formattedMinutes}M`;
}

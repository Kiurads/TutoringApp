/**
 * Pure availability checker — no imports, safe to use on client and server.
 *
 * A class is considered "within availability" if every 30-minute block it
 * occupies has a matching availability slot for that teacher.
 *
 * If the teacher has saved NO slots we treat them as always available
 * (they haven't configured their schedule yet).
 */
export function isWithinAvailability(
	slots: { dayOfWeek: number; startHour: number; startMin: number }[],
	startTime: Date,
	durationInHours: number,
): boolean {
	if (slots.length === 0) return true;

	const available = new Set(
		slots.map((s) => `${s.dayOfWeek}-${s.startHour}-${s.startMin}`),
	);

	const dayOfWeek = startTime.getDay(); // 0=Sun … 6=Sat
	const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
	const totalMinutes = Math.round(durationInHours * 60);

	for (let offset = 0; offset < totalMinutes; offset += 30) {
		const abs = startMinutes + offset;
		const h = Math.floor(abs / 60);
		const m = abs % 60;
		if (!available.has(`${dayOfWeek}-${h}-${m}`)) return false;
	}
	return true;
}

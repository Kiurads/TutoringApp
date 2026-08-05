/**
 * Pure availability checker — no imports, safe to use on client and server.
 *
 * A class is considered "within availability" if every 30-minute block it
 * occupies has a matching availability slot for that teacher.
 *
 * If the teacher has saved NO slots we treat them as always available
 * (they haven't configured their schedule yet).
 */

const WEEKDAY_INDEX: Record<string, number> = {
	Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// Converts a UTC instant into its calendar day-of-week/hour/minute in
// `timezone` — the actual fix for #128: a teacher's `TeacherAvailability`
// slots are stored as plain day/hour/minute integers meant in *their own*
// local time (whatever they were looking at when they painted the grid),
// not UTC. Comparing a booking's UTC instant directly against those
// integers (the old behavior) only happened to work if the teacher and the
// server were in the same timezone — this server runs in UTC, so it was
// silently wrong for every non-UTC teacher.
function toZonedParts(date: Date, timeZone: string): { dayOfWeek: number; hour: number; minute: number } {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);

	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	return {
		dayOfWeek: WEEKDAY_INDEX[get("weekday")] ?? 0,
		hour: parseInt(get("hour"), 10),
		minute: parseInt(get("minute"), 10),
	};
}

export function isWithinAvailability(
	slots: { dayOfWeek: number; startHour: number; startMin: number }[],
	startTime: Date,
	durationInHours: number,
	timezone: string = "UTC",
): boolean {
	if (slots.length === 0) return true;

	const available = new Set(
		slots.map((s) => `${s.dayOfWeek}-${s.startHour}-${s.startMin}`),
	);

	const { dayOfWeek, hour, minute } = toZonedParts(startTime, timezone);
	const startMinutes = hour * 60 + minute;
	const totalMinutes = Math.round(durationInHours * 60);

	for (let offset = 0; offset < totalMinutes; offset += 30) {
		const abs = startMinutes + offset;
		const h = Math.floor(abs / 60);
		const m = abs % 60;
		if (!available.has(`${dayOfWeek}-${h}-${m}`)) return false;
	}
	return true;
}

/**
 * Rule-based Tutor Fit Score — no AI required.
 * Returns null when the student has no class history (score would be meaningless).
 *
 * Scoring:
 *   +30  Subject overlap  — teacher teaches a subject the student has taken
 *   +20  High rating      — teacher avg rating ≥ 4.5
 *   +20  Day overlap      — teacher available on days the student has studied
 *   +30  Prior sessions   — student has already had a completed class with this teacher
 *        ────────────────────────────────────────────────────────────────────
 *   100  max
 */

export interface ClassHistoryEntry {
	teacherId: string | null;
	subjectId: string;
	startTime: Date;
}

export interface TeacherForScore {
	id: string;
	rating: string;
	subjectIds: string[];
	availabilityDays: number[]; // unique dayOfWeek values (0=Sun…6=Sat)
}

export function computeFitScore(
	teacher: TeacherForScore,
	completedClasses: ClassHistoryEntry[],
): number | null {
	if (completedClasses.length === 0) return null;

	let score = 0;

	// +30: teacher teaches a subject the student has taken before
	const studentSubjects = new Set(completedClasses.map((c) => c.subjectId));
	if (teacher.subjectIds.some((id) => studentSubjects.has(id))) score += 30;

	// +20: teacher has a strong rating
	if (teacher.rating !== "No Reviews" && parseFloat(teacher.rating) >= 4.5) score += 20;

	// +20: teacher available on days the student typically studies
	if (teacher.availabilityDays.length > 0) {
		const studentDays = new Set(
			completedClasses.map((c) => new Date(c.startTime).getDay()),
		);
		const teacherDays = new Set(teacher.availabilityDays);
		if ([...studentDays].some((d) => teacherDays.has(d))) score += 20;
	}

	// +30: student has had at least one completed session with this teacher
	if (completedClasses.some((c) => c.teacherId === teacher.id)) score += 30;

	return score;
}

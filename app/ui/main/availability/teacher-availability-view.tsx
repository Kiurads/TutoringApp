"use client";

import { useRouter } from "next/navigation";
import AvailabilityGrid from "./availability-grid";
import type { AvailabilitySlot } from "@/app/lib/actions/availability.actions";

interface Props {
	teacherId: string;
	slots: AvailabilitySlot[];
	timezone?: string;
}

export default function TeacherAvailabilityView({ teacherId, slots, timezone }: Props) {
	const router = useRouter();

	function handleSlotClick(day: number, hour: number, min: number) {
		// Build an ISO-like datetime for the coming occurrence of this weekday/time.
		// KNOWN GAP: hour/min are the teacher's local time (see `timezone` prop
		// above), but setHours()/getDay() below operate in the *browser's* local
		// time — for a student in a different timezone than the teacher, this
		// pre-fills a slightly wrong instant. Not a correctness risk: the actual
		// booking is re-validated server-side against isWithinAvailability with
		// the teacher's real timezone (see app/lib/availability/README.md), so a
		// wrong pre-fill here just means the student sees an off-by-some-hours
		// suggested time in the booking form, not an insecurely-booked class.
		// Left as a follow-up rather than folded into the #128 fix.
		const now = new Date();
		// JS getDay(): 0=Sun…6=Sat; our dayOfWeek: 1=Mon…0=Sun (same as JS)
		const jsDay = day; // 0=Sun,1=Mon,…,6=Sat
		const daysAhead = ((jsDay - now.getDay() + 7) % 7) || 7; // always future
		const target = new Date(now);
		target.setDate(now.getDate() + daysAhead);
		target.setHours(hour, min, 0, 0);
		const iso = target.toISOString();
		router.push(`/main/student/classes/request?teacher=${teacherId}&startTime=${encodeURIComponent(iso)}`);
	}

	if (slots.length === 0) return null;

	return (
		<div className="card bg-base-200 rounded-xl p-6 animate-fade-in">
			<h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
				Weekly Availability
				{timezone && (
					<span className="normal-case font-normal text-base-content/40 ml-2">
						(times shown in {timezone.replace(/_/g, " ")})
					</span>
				)}
			</h2>
			<AvailabilityGrid
				initialSlots={slots}
				readOnly
				onSlotClick={handleSlotClick}
			/>
			<p className="text-xs text-base-content/40 mt-3 italic">
				Click an available (green) slot to pre-fill the booking form.
			</p>
		</div>
	);
}

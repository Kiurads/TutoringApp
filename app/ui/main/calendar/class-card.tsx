"use client";

import { ClassDataCalendar } from "@/app/lib/actions/classes.actions";

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; sub: string }> = {
	requested: { bg: "bg-warning/30",  border: "border-warning",  text: "text-warning",  sub: "text-warning/70"  },
	scheduled: { bg: "bg-info/30",     border: "border-info",     text: "text-info",     sub: "text-info/70"     },
	completed: { bg: "bg-success/30",  border: "border-success",  text: "text-success",  sub: "text-success/70"  },
	refused:   { bg: "bg-error/30",    border: "border-error",    text: "text-error",    sub: "text-error/70"    },
};

const FALLBACK = { bg: "bg-base-200", border: "border-base-300", text: "text-base-content", sub: "text-base-content/60" };

interface Props {
	classData: ClassDataCalendar;
	hourPx: number;
	gridStart: number;
	onClick?: () => void;
}

export default function CalendarClassCard({ classData, hourPx, gridStart, onClick }: Props) {
	const [hourStr, minStr] = classData.startTime.split(":");
	const startHour = parseInt(hourStr, 10) + parseInt(minStr, 10) / 60;
	const top = (startHour - gridStart) * hourPx;
	const height = Math.max(classData.duration * hourPx, hourPx * 0.5);

	const s = STATUS_STYLE[classData.status] ?? FALLBACK;

	// Calculate end time for display
	const endHour = startHour + classData.duration;
	const endH = Math.floor(endHour);
	const endM = Math.round((endHour - endH) * 60);
	const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

	return (
		<button
			onClick={onClick}
			onMouseDown={(e) => e.stopPropagation()}
			style={{ top: `${top}px`, height: `${height}px` }}
			className={`
				absolute left-1 right-1 z-10 rounded-md border-l-[3px] px-1.5 py-1 text-left
				overflow-hidden shadow-sm transition-all
				hover:z-20 hover:shadow-md hover:brightness-95
				focus:outline-none focus:ring-2 focus:ring-primary
				${s.bg} ${s.border}
			`}
			title={`${classData.subject} — ${classData.startTime}`}
		>
			<p className={`text-xs font-semibold leading-tight truncate capitalize ${s.text}`}>
				{classData.subject}
			</p>
			{height >= hourPx * 0.5 && (
				<p className={`text-[0.65rem] leading-tight truncate mt-0.5 ${s.sub}`}>
					{classData.startTime}–{endTime}
					{classData.teacherName !== "TBD" ? ` · ${classData.teacherName}` : ""}
				</p>
			)}
		</button>
	);
}

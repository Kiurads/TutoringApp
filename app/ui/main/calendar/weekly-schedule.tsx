"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClassDataCalendar } from "@/app/lib/actions/classes.actions";
import CalendarClassCard from "./class-card";

const HOUR_PX = 64;
const GRID_START = 7;
const GRID_END = 22;
const HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonday(d: Date): Date {
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	const m = new Date(d);
	m.setDate(d.getDate() + diff);
	m.setHours(0, 0, 0, 0);
	return m;
}

function addDays(d: Date, n: number): Date {
	const r = new Date(d);
	r.setDate(d.getDate() + n);
	return r;
}

function toDateStr(d: Date): string {
	const p = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatHour(h: number): string {
	if (h === 12) return "12 PM";
	if (h === 0 || h === 24) return "12 AM";
	return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function slotToTime(slot: number): string {
	const h = Math.floor(slot);
	const m = Math.round((slot - h) * 60);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDuration(hours: number): string {
	if (hours < 1) return `${Math.round(hours * 60)} min`;
	if (hours % 1 === 0) return `${hours}h`;
	const h = Math.floor(hours);
	const m = Math.round((hours % 1) * 60);
	return `${h}h ${m}min`;
}

function formatDate(dateStr: string): string {
	const [y, mo, d] = dateStr.split("-").map(Number);
	return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
		weekday: "long", month: "long", day: "numeric",
	});
}

/** Snap a clientY to the nearest 30-min slot relative to a column element. */
function getSlot(clientY: number, el: HTMLElement): number {
	const rect = el.getBoundingClientRect();
	const raw = (clientY - rect.top) / HOUR_PX + GRID_START;
	return Math.max(GRID_START, Math.min(GRID_END, Math.round(raw * 2) / 2));
}

interface DragState {
	date: string;
	startSlot: number;
	currentSlot: number;
}

interface HoverState {
	date: string;
	slot: number;
}

interface ScheduleModal {
	date: string;
	startSlot: number;
	endSlot: number;
}

interface Props {
	classes: ClassDataCalendar[];
	basePath: string;
}

export default function WeeklySchedule({ classes, basePath }: Props) {
	const router = useRouter();
	const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
	const [drag, setDrag] = useState<DragState | null>(null);
	const [hover, setHover] = useState<HoverState | null>(null);
	const [modal, setModal] = useState<ScheduleModal | null>(null);

	// Ref tracks the active drag so global listeners never have stale closures
	const activeDrag = useRef<{ colEl: HTMLElement; date: string; startSlot: number } | null>(null);
	const modalRef = useRef<HTMLDialogElement>(null);

	// Real showModal()/close() instead of a CSS-only "modal-open" class: free
	// focus trap + Escape-to-close (see class-action-modals.tsx for the same
	// pattern). onClose keeps `modal` state in sync when dismissed via Escape.
	useEffect(() => {
		if (modal) modalRef.current?.showModal();
		else modalRef.current?.close();
	}, [modal]);

	const todayStr = toDateStr(new Date());
	const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
	const weekDateStrings = weekDates.map(toDateStr);

	const byDate: Record<string, ClassDataCalendar[]> = {};
	for (const cls of classes) {
		if (!byDate[cls.date]) byDate[cls.date] = [];
		byDate[cls.date].push(cls);
	}

	const weekEnd = weekDates[6];
	const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
	const weekLabel = sameMonth
		? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
		: `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

	const gridHeight = (GRID_END - GRID_START) * HOUR_PX;

	// ── Global mouse listeners (attached once, use ref for current drag) ────────

	useEffect(() => {
		function onMouseMove(e: MouseEvent) {
			const ad = activeDrag.current;
			if (!ad) return;
			const slot = getSlot(e.clientY, ad.colEl);
			setDrag({ date: ad.date, startSlot: ad.startSlot, currentSlot: slot });
		}

		function onMouseUp() {
			const ad = activeDrag.current;
			if (!ad) return;
			// Read final slot from DOM — avoids reading potentially-stale state
			setDrag((prev) => {
				if (!prev) return null;
				const start = Math.min(prev.startSlot, prev.currentSlot);
				const end   = Math.max(prev.startSlot, prev.currentSlot);
				setModal({ date: prev.date, startSlot: start, endSlot: Math.max(end, start + 0.5) });
				return null;
			});
			activeDrag.current = null;
		}

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, []);

	// ── Column event handlers ────────────────────────────────────────────────────

	function handleMouseDown(e: React.MouseEvent<HTMLDivElement>, dateStr: string) {
		if (e.button !== 0) return;
		e.preventDefault();
		const slot = getSlot(e.clientY, e.currentTarget);
		activeDrag.current = { colEl: e.currentTarget, date: dateStr, startSlot: slot };
		setDrag({ date: dateStr, startSlot: slot, currentSlot: slot });
		setHover(null);
	}

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, dateStr: string) => {
		// Only used for hover indicator (drag is handled globally)
		if (activeDrag.current) return;
		const slot = getSlot(e.clientY, e.currentTarget);
		setHover((prev) =>
			prev?.date === dateStr && prev?.slot === slot ? prev : { date: dateStr, slot },
		);
	}, []);

	const handleMouseLeave = useCallback((dateStr: string) => {
		setHover((prev) => (prev?.date === dateStr ? null : prev));
	}, []);

	// ── Routing ──────────────────────────────────────────────────────────────────

	function handleSchedule() {
		if (!modal) return;
		const startTime = slotToTime(modal.startSlot);
		const duration = modal.endSlot - modal.startSlot;
		router.push(
			`${basePath}/classes/request?startTime=${encodeURIComponent(`${modal.date}T${startTime}`)}&duration=${duration}`
		);
		setModal(null);
	}

	return (
		<>
			<div className="flex flex-col rounded-xl border border-base-300 bg-base-100 overflow-hidden select-none">
				{/* Toolbar */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200">
					<div className="flex items-center gap-2">
						<button onClick={() => setWeekStart(getMonday(new Date()))} className="btn btn-sm btn-ghost border border-base-300">
							Today
						</button>
						<button onClick={() => setWeekStart(addDays(weekStart, -7))} className="btn btn-sm btn-ghost btn-square" aria-label="Previous week">
							<i className="fa-solid fa-chevron-left text-xs" />
						</button>
						<button onClick={() => setWeekStart(addDays(weekStart, 7))} className="btn btn-sm btn-ghost btn-square" aria-label="Next week">
							<i className="fa-solid fa-chevron-right text-xs" />
						</button>
						<span className="font-semibold text-sm">{weekLabel}</span>
					</div>

					<div className="hidden sm:flex items-center gap-3 text-xs text-base-content/50">
						<span className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-warning/15 border-l-2 border-warning inline-block" />
							Pending
						</span>
						<span className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-info/15 border-l-2 border-info inline-block" />
							Scheduled
						</span>
						<span className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-sm bg-success/15 border-l-2 border-success inline-block" />
							Completed
						</span>
						<span className="text-base-content/30 italic">drag to schedule</span>
					</div>
				</div>

				<div className="overflow-x-auto">
					<div className="min-w-[640px]">
						{/* Day headers */}
						<div className="grid border-b border-base-300" style={{ gridTemplateColumns: "3rem 1fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
							<div className="border-r border-base-300" />
							{weekDates.map((date, i) => {
								const dateStr = toDateStr(date);
								const isToday = dateStr === todayStr;
								return (
									<div key={dateStr} className={`text-center py-2 text-xs font-medium border-r border-base-300 last:border-r-0 ${isToday ? "bg-primary/10" : ""}`}>
										<span className="text-base-content/50 uppercase tracking-wide">{DAYS[i]}</span>
										<div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-primary text-primary-content" : "text-base-content"}`}>
											{date.getDate()}
										</div>
									</div>
								);
							})}
						</div>

						{/* Time grid */}
						<div className="flex">
							{/* Hour labels */}
							<div className="w-12 shrink-0 relative border-r border-base-300" style={{ height: `${gridHeight}px` }}>
								{HOURS.map((h) => (
									<div key={h} className="absolute w-full text-right pr-2" style={{ top: `${(h - GRID_START) * HOUR_PX - 8}px` }}>
										<span className="text-[0.6rem] text-base-content/40 leading-none">{formatHour(h)}</span>
									</div>
								))}
							</div>

							{/* Day columns */}
							{weekDateStrings.map((dateStr) => {
								const isToday = dateStr === todayStr;
								const dayClasses = byDate[dateStr] ?? [];
								const isDragging = drag?.date === dateStr;
								const isHovered = !drag && hover?.date === dateStr;

								// Drag geometry — always show at least 30 min once started
								const dragStart  = isDragging ? Math.min(drag.startSlot, drag.currentSlot) : GRID_START;
								const dragEnd    = isDragging ? Math.max(drag.startSlot, drag.currentSlot) : GRID_START;
								const dragTop    = (dragStart - GRID_START) * HOUR_PX;
								const dragHeight = Math.max(dragEnd - dragStart, isDragging ? 0.5 : 0) * HOUR_PX;

								return (
									<div
										key={dateStr}
										className={`flex-1 relative border-r border-base-300 last:border-r-0 cursor-crosshair ${isToday ? "bg-primary/5" : ""}`}
										style={{ height: `${gridHeight}px` }}
										onMouseDown={(e) => handleMouseDown(e, dateStr)}
										onMouseMove={(e) => handleMouseMove(e, dateStr)}
										onMouseLeave={() => handleMouseLeave(dateStr)}
									>
										{/* Hour grid lines */}
										{HOURS.map((h) => (
											<div key={h} className="absolute left-0 right-0 border-t border-base-300" style={{ top: `${(h - GRID_START) * HOUR_PX}px` }} />
										))}

										{/* Half-hour dashed lines */}
										{HOURS.map((h) => (
											<div key={`${h}.5`} className="absolute left-0 right-0 border-t border-base-300/20 border-dashed" style={{ top: `${(h - GRID_START + 0.5) * HOUR_PX}px` }} />
										))}

										{/* Current time indicator */}
										{isToday && (() => {
											const now = new Date();
											const cur = now.getHours() + now.getMinutes() / 60;
											if (cur >= GRID_START && cur < GRID_END) {
												return (
													<div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${(cur - GRID_START) * HOUR_PX}px` }}>
														<span className="w-2 h-2 rounded-full bg-error shrink-0 -ml-1" />
														<div className="flex-1 h-px bg-error" />
													</div>
												);
											}
											return null;
										})()}

										{/* Hover indicator — faint tint + time hairline */}
										{isHovered && (
											<>
												<div className="absolute inset-0 bg-primary/[0.05] pointer-events-none" />
												<div
													className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
													style={{ top: `${(hover!.slot - GRID_START) * HOUR_PX}px` }}
												>
													<div className="flex-1 border-t-2 border-dashed border-primary/40" />
													<span className="text-[0.6rem] font-bold text-primary bg-base-100 border border-primary/30 rounded px-1 py-px leading-none mr-1 shadow-sm">
														{slotToTime(hover!.slot)}
													</span>
												</div>
											</>
										)}

										{/* Drag selection overlay */}
										{isDragging && (
											<div
												className="absolute left-0 right-0 z-30 pointer-events-none"
												style={{ top: `${dragTop}px`, height: `${dragHeight}px` }}
											>
												{/* Fill */}
												<div className="absolute inset-0 bg-primary/20" />
												{/* Left accent border */}
												<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
												{/* Top label */}
												<div className="absolute top-1 left-2 right-2 flex items-center justify-between">
													<span className="text-[0.65rem] font-bold text-primary leading-none drop-shadow-sm">
														{slotToTime(dragStart)}
													</span>
													{dragHeight >= HOUR_PX * 0.5 && (
														<span className="text-[0.6rem] font-semibold text-primary/80 leading-none">
															{formatDuration(Math.max(dragEnd - dragStart, 0.5))}
														</span>
													)}
												</div>
												{/* Bottom end-time label */}
												{dragHeight >= HOUR_PX && (
													<div className="absolute bottom-1 left-2">
														<span className="text-[0.6rem] font-bold text-primary/80 leading-none">
															{slotToTime(Math.max(dragEnd, dragStart + 0.5))}
														</span>
													</div>
												)}
											</div>
										)}

										{/* Class blocks */}
										{dayClasses.map((cls) => (
											<CalendarClassCard
												key={cls.id}
												classData={cls}
												hourPx={HOUR_PX}
												gridStart={GRID_START}
												onClick={() => router.push(`${basePath}/classes/${cls.id}`)}
											/>
										))}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* Schedule modal */}
			<dialog ref={modalRef} className="modal" onClose={() => setModal(null)}>
				{modal && (
					<div className="modal-box max-w-sm animate-scale-in">
						<h3 className="font-bold text-lg mb-1">Schedule a Class</h3>
						<p className="text-sm text-base-content/60 mb-4">{formatDate(modal.date)}</p>

						<div className="grid grid-cols-2 gap-3 mb-6">
							<div className="bg-base-200 rounded-lg p-3">
								<p className="text-xs text-base-content/50 mb-0.5">Start</p>
								<p className="font-semibold">{slotToTime(modal.startSlot)}</p>
							</div>
							<div className="bg-base-200 rounded-lg p-3">
								<p className="text-xs text-base-content/50 mb-0.5">Duration</p>
								<p className="font-semibold">{formatDuration(modal.endSlot - modal.startSlot)}</p>
							</div>
						</div>

						<div className="flex gap-3">
							<button className="btn btn-primary flex-1" onClick={handleSchedule}>
								<i className="fa-solid fa-calendar-plus" />
								Continue
							</button>
							<button className="btn btn-ghost flex-1" onClick={() => setModal(null)}>
								Cancel
							</button>
						</div>
					</div>
				)}
				<div className="modal-backdrop" onClick={() => setModal(null)} />
			</dialog>
		</>
	);
}

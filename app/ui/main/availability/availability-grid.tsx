"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
	setAvailability,
	type AvailabilitySlot,
} from "@/app/lib/actions/availability.actions";

const DAYS      = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1…Sat=6, Sun=0
const WEEKDAYS  = new Set([1, 2, 3, 4, 5]);

const SLOTS: { hour: number; min: number; label: string }[] = [];
for (let h = 7; h < 22; h++) {
	SLOTS.push({ hour: h, min: 0,  label: `${String(h).padStart(2, "0")}:00` });
	SLOTS.push({ hour: h, min: 30, label: `${String(h).padStart(2, "0")}:30` });
}

function slotKey(day: number, hour: number, min: number) {
	return `${day}-${hour}-${min}`;
}

function buildSlotSet(days: number[], startH: number, endH: number): Set<string> {
	const s = new Set<string>();
	for (const d of days)
		for (let h = startH; h < endH; h++) {
			s.add(slotKey(d, h, 0));
			s.add(slotKey(d, h, 30));
		}
	return s;
}

const PRESETS = [
	{ label: "Weekday mornings",   icon: "fa-sun",            build: () => buildSlotSet([...WEEKDAYS], 8, 13) },
	{ label: "Weekday afternoons", icon: "fa-cloud-sun",      build: () => buildSlotSet([...WEEKDAYS], 13, 18) },
	{ label: "Weekday evenings",   icon: "fa-moon",           build: () => buildSlotSet([...WEEKDAYS], 18, 22) },
	{ label: "Weekends",           icon: "fa-umbrella-beach", build: () => buildSlotSet([0, 6], 9, 21) },
];

interface Props {
	initialSlots: AvailabilitySlot[];
	readOnly?: boolean;
	onSlotClick?: (day: number, hour: number, min: number) => void;
	bookedSlots?: { dayOfWeek: number; startHour: number; startMin: number }[];
	// Only meaningful (and only editable) when !readOnly — this is what tells
	// the server what a teacher's own "9:00" actually means when checking a
	// booking against their slots (see app/lib/availability/README.md).
	initialTimezone?: string;
}

// Falls back to a fixed, small list if the runtime somehow lacks this API
// (very old Node/browsers) — Intl.supportedValuesOf has been available in
// Node since v18 and all evergreen browsers since 2022, so this is a belt
// only, not expected to actually trigger in practice.
function getSupportedTimezones(): string[] {
	try {
		return Intl.supportedValuesOf("timeZone");
	} catch {
		return ["UTC", "Europe/Lisbon", "Europe/London", "America/New_York"];
	}
}

export default function AvailabilityGrid({
	initialSlots,
	readOnly = false,
	onSlotClick,
	bookedSlots = [],
	initialTimezone = "UTC",
}: Props) {
	const initial = new Set(
		initialSlots.map((s) => slotKey(s.dayOfWeek, s.startHour, s.startMin)),
	);

	const [active, setActive] = useState<Set<string>>(() => new Set(initial));
	const [timezone, setTimezone] = useState(initialTimezone);
	const [timezones] = useState<string[]>(getSupportedTimezones);
	const [isPending, startTransition] = useTransition();
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const bookedSet = new Set(
		bookedSlots.map((s) => slotKey(s.dayOfWeek, s.startHour, s.startMin)),
	);

	const hasUnsaved = !readOnly &&
		([...active].sort().join() !== [...initial].sort().join() || timezone !== initialTimezone);

	// ── Drag refs (no stale closures) ─────────────────────────────────────────
	const isDraggingRef  = useRef(false);
	const dragValueRef   = useRef(true); // true = painting ON, false = erasing
	const visitedRef     = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (readOnly) return;

		function onMouseMove(e: MouseEvent) {
			if (!isDraggingRef.current) return;
			const el = document.elementFromPoint(e.clientX, e.clientY);
			const key = el?.getAttribute("data-slotkey");
			if (!key || visitedRef.current.has(key)) return;
			visitedRef.current.add(key);
			setActive((prev) => {
				const next = new Set(prev);
				if (dragValueRef.current) next.add(key);
				else next.delete(key);
				return next;
			});
			setSaved(false);
		}

		function onMouseUp() {
			isDraggingRef.current = false;
			visitedRef.current    = new Set();
		}

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup",   onMouseUp);
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup",   onMouseUp);
		};
	}, [readOnly]);

	// ── Cell interaction ───────────────────────────────────────────────────────

	function handleCellMouseDown(key: string, day: number, hour: number, min: number) {
		if (readOnly) {
			// Read-only: call slot click if free
			const isFree = active.has(key) && !bookedSet.has(key);
			if (isFree && onSlotClick) onSlotClick(day, hour, min);
			return;
		}
		const painting = !active.has(key); // click on inactive = paint ON
		dragValueRef.current = painting;
		isDraggingRef.current = true;
		visitedRef.current = new Set([key]);
		setActive((prev) => {
			const next = new Set(prev);
			if (painting) next.add(key);
			else next.delete(key);
			return next;
		});
		setSaved(false);
	}

	// ── Save ───────────────────────────────────────────────────────────────────

	function handleSave() {
		setSaved(false);
		setError(null);
		const slots: AvailabilitySlot[] = [];
		for (const key of active) {
			const [day, hour, min] = key.split("-").map(Number);
			slots.push({
				dayOfWeek: day,
				startHour: hour,
				startMin:  min,
				endHour:   min === 30 ? hour + 1 : hour,
				endMin:    min === 30 ? 0 : 30,
			});
		}
		startTransition(async () => {
			const result = await setAvailability(slots, timezone);
			if (result.error) setError(result.error);
			else setSaved(true);
		});
	}

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="flex flex-col gap-4" onMouseLeave={() => { isDraggingRef.current = false; }}>

			{/* Edit-mode toolbar */}
			{!readOnly && (
				<div className="flex flex-col gap-3">
					<p className="text-sm text-base-content/60">
						<i className="fa-solid fa-hand-pointer mr-1.5 opacity-60"></i>
						Click or drag cells to mark when you&apos;re available each week.
					</p>
					<label className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-base-content/60">
							<i className="fa-solid fa-globe mr-1.5 opacity-60"></i>
							Your timezone
						</span>
						<select
							className="select select-bordered select-sm max-w-xs"
							value={timezone}
							onChange={(e) => { setTimezone(e.target.value); setSaved(false); }}
						>
							{timezones.map((tz) => (
								<option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
							))}
						</select>
						<span className="text-xs text-base-content/40">
							The hours below are in this timezone — students booking from elsewhere still see (and book) the right time.
						</span>
					</label>
					<div className="flex flex-wrap gap-2 items-center">
						<span className="text-xs font-semibold text-base-content/40 uppercase tracking-wide mr-1">
							Quick add:
						</span>
						{PRESETS.map((p) => (
							<button
								key={p.label}
								type="button"
								className="btn btn-xs btn-outline gap-1.5"
								onClick={() => {
									setActive((prev) => {
										const next = new Set(prev);
										for (const k of p.build()) next.add(k);
										return next;
									});
									setSaved(false);
								}}
							>
								<i className={`fa-solid ${p.icon} text-[10px]`}></i>
								{p.label}
							</button>
						))}
						{active.size > 0 && (
							<button
								type="button"
								className="btn btn-xs btn-ghost text-error gap-1.5 ml-auto"
								onClick={() => { setActive(new Set()); setSaved(false); }}
							>
								<i className="fa-solid fa-trash-can text-[10px]"></i>
								Clear all
							</button>
						)}
					</div>
				</div>
			)}

			{/* Mobile scroll hint — the grid below scrolls horizontally but gives
			    no visual cue on its own that more days continue off-screen */}
			<p className="sm:hidden text-xs text-base-content/40 flex items-center gap-1.5 -mb-1">
				<i className="fa-solid fa-arrows-left-right"></i>
				Scroll sideways to see the full week
			</p>

			{/* Grid */}
			<div className="overflow-x-auto rounded-xl border border-base-300">
				<div
					className="grid select-none min-w-[420px]"
					style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}
				>
					{/* Header */}
					<div className="bg-base-200 border-b border-base-300" />
					{DAYS.map((d, i) => (
						<div
							key={d}
							className={`bg-base-200 border-b border-base-300 text-center text-xs font-semibold py-2 ${
								i >= 5 ? "text-primary" : "text-base-content/60"
							}`}
						>
							{d}
						</div>
					))}

					{/* Rows */}
					{SLOTS.map((slot) => {
						const isHourStart = slot.min === 0;
						return (
							<React.Fragment key={`row-${slot.hour}-${slot.min}`}>
								{/* Time label */}
								<div
									className={`text-right pr-2 text-xs text-base-content/40 flex items-center justify-end bg-base-200/40 ${
										isHourStart ? "border-t border-base-300" : "border-t border-base-200"
									}`}
									style={{ height: "2rem" }}
								>
									{isHourStart ? slot.label : ""}
								</div>

								{/* Day cells */}
								{DAY_VALUES.map((dayVal) => {
									const key      = slotKey(dayVal, slot.hour, slot.min);
									const isActive = active.has(key);
									const isBooked = bookedSet.has(key);
									const isFree   = isActive && !isBooked;
									const isWeekend = !WEEKDAYS.has(dayVal);

									let cellClass = `border-l ${isHourStart ? "border-t border-base-300" : "border-t border-base-200"} transition-colors duration-75`;

									if (readOnly) {
										if (isBooked)
											cellClass += " bg-error/20 border-l-[3px] border-l-error cursor-not-allowed";
										else if (isFree)
											cellClass += " bg-success/20 border-l-[3px] border-l-success hover:bg-success/35 cursor-pointer";
										else
											cellClass += isWeekend
												? " bg-base-300/40"
												: " bg-base-200";
									} else {
										if (isActive)
											cellClass += " bg-info hover:bg-info/80 cursor-pointer";
										else
											cellClass += isWeekend
												? " bg-base-300/40 cursor-pointer hover:bg-base-300"
												: " bg-base-200 cursor-pointer hover:bg-base-300";
									}

									const showLabel = readOnly && (isBooked || isFree) && isHourStart;

									return (
										<div
											key={key}
											data-slotkey={readOnly ? undefined : key}
											className={cellClass}
											style={{ height: "2rem" }}
											onMouseDown={() => handleCellMouseDown(key, dayVal, slot.hour, slot.min)}
										>
											{showLabel && (
												<span className={`text-[9px] font-semibold leading-none px-1 pt-1 block truncate pointer-events-none select-none ${
													isBooked ? "text-error" : "text-success"
												}`}>
													{slot.label}
												</span>
											)}
										</div>
									);
								})}
							</React.Fragment>
						);
					})}
				</div>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-base-content/50">
				{readOnly ? (
					<>
						<span className="flex items-center gap-1.5">
							<span className="inline-block w-3 h-3 rounded-sm bg-success/20 border-l-[3px] border-l-success" />
							Available — click to book
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block w-3 h-3 rounded-sm bg-error/20 border-l-[3px] border-l-error" />
							Already booked
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block w-3 h-3 rounded-sm bg-base-200 border border-base-300" />
							Unavailable
						</span>
					</>
				) : (
					<>
						<span className="flex items-center gap-1.5">
							<span className="inline-block w-3 h-3 rounded-sm bg-info border border-info" />
							Available
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block w-3 h-3 rounded-sm bg-base-200 border border-base-300" />
							Unavailable
						</span>
						<span className="italic text-base-content/30">
							<i className="fa-solid fa-hand-pointer mr-1"></i>Click or drag to toggle
						</span>
					</>
				)}
			</div>

			{/* Edit footer: slot count + save */}
			{!readOnly && (
				<div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-base-300">
					<div className="flex items-center gap-2 text-sm text-base-content/60">
						<i className="fa-solid fa-calendar-check opacity-60"></i>
						<span>
							<strong className="text-base-content">{active.size}</strong>{" "}
							slot{active.size !== 1 ? "s" : ""} selected
							{active.size > 0 && (
								<span className="text-base-content/40 ml-1">
									({Math.ceil(active.size / 2)}h / week)
								</span>
							)}
						</span>
						{hasUnsaved && (
							<span className="badge badge-warning badge-sm gap-1">
								<i className="fa-solid fa-circle text-[6px]"></i>
								Unsaved
							</span>
						)}
					</div>

					<div className="flex items-center gap-3 sm:ml-auto">
						<button
							className="btn btn-primary btn-sm gap-2"
							onClick={handleSave}
							disabled={isPending}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-xs" />
							) : (
								<i className="fa-solid fa-floppy-disk" />
							)}
							Save availability
						</button>
						{saved && (
							<span className="text-success text-sm animate-fade-in flex items-center gap-1">
								<i className="fa-solid fa-circle-check" /> Saved!
							</span>
						)}
						{error && (
							<span className="text-error text-sm animate-fade-in">{error}</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

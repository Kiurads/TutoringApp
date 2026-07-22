"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { createClassAsStudent } from "@/app/lib/classes/create-class-as-student";
import { fetchTeachersForBooking, type TeacherBookingOption } from "@/app/lib/actions/teachers.actions";
import { fetchSubjectsWithTeachers } from "@/app/lib/actions/subjects.actions";
import SubjectSelect from "./subject-select";
import StartTimeInput from "./start-time-input";
import DurationSelect from "./duration-select";
import GoBackButton from "@/app/ui/go-back-button";
import PreAuthForm from "@/app/ui/payment/pre-auth-form";
import type { PreAuthClassData } from "@/app/lib/classes/create-class-with-pre-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InitialTeacher {
	id: string;
	name: string;
	subjects: { id: string; name: string }[];
}

interface PreAuthState {
	clientSecret: string;
	intentId: string;
	totalPrice: number;
	classData: PreAuthClassData;
	teacherName: string;
}

type Phase = "details" | "teacher" | "payment";

const DURATIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.25);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(h: number): string {
	const m = Math.round(h * 60);
	if (m < 60) return `${m} min`;
	if (m % 60 === 0) return `${m / 60}h`;
	return `${Math.floor(m / 60)}h ${m % 60}min`;
}

function fmtDateTime(iso: string): string {
	const d = new Date(iso);
	if (isNaN(d.getTime())) return iso;
	return (
		d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
		" · " +
		d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
	);
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ phase }: { phase: Phase }) {
	const steps: { key: Phase; label: string }[] = [
		{ key: "details", label: "Details" },
		{ key: "teacher", label: "Teacher" },
		{ key: "payment", label: "Payment" },
	];
	const activeIdx = steps.findIndex((s) => s.key === phase);

	return (
		<div className="flex items-center gap-2 mb-6">
			{steps.map((s, i) => {
				const done = i < activeIdx;
				const active = i === activeIdx;
				return (
					<React.Fragment key={s.key}>
						<div className="flex flex-col items-center gap-1 shrink-0">
							<div
								className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
									done
										? "bg-success text-success-content"
										: active
										? "bg-primary text-primary-content"
										: "bg-base-300 text-base-content/40"
								}`}
							>
								{done ? <i className="fa-solid fa-check" /> : i + 1}
							</div>
							<span
								className={`text-[0.6rem] uppercase tracking-wide font-semibold ${
									active ? "text-primary" : "text-base-content/40"
								}`}
							>
								{s.label}
							</span>
						</div>
						{i < steps.length - 1 && (
							<div
								className={`flex-1 h-px mb-3 transition-colors ${
									done ? "bg-success" : "bg-base-300"
								}`}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}

// ── Teacher card (phase 2) ─────────────────────────────────────────────────────

function TeacherCard({
	teacher,
	isSelected,
	onSelect,
}: {
	teacher: TeacherBookingOption;
	isSelected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
				isSelected
					? "border-primary bg-primary/10"
					: "border-base-300 hover:border-primary/40"
			} ${!teacher.isAvailable ? "opacity-60" : ""}`}
		>
			<div className="flex items-center gap-3">
				{/* Avatar */}
				<div className="relative shrink-0">
					<div className="w-10 h-10 rounded-full bg-neutral text-neutral-content text-sm font-bold flex items-center justify-center">
						{teacher.name.charAt(0).toUpperCase()}
					</div>
					{teacher.isOnline && (
						<span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100">
							<span className="sr-only">Online</span>
						</span>
					)}
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1">
					<p className="font-medium text-sm capitalize">{teacher.name}</p>
					{teacher.isAvailable ? (
						<p className="text-xs text-success font-medium">
							<i className="fa-solid fa-circle-check mr-1" />Available at this time
						</p>
					) : (
						<p className="text-xs text-base-content/40">
							<i className="fa-regular fa-clock mr-1" />Not in schedule
						</p>
					)}
				</div>

				{/* Price + rating */}
				<div className="flex flex-col items-end gap-0.5 shrink-0">
					<span className="font-semibold text-sm">{teacher.pricePerHour}€/h</span>
					{teacher.rating !== "No Reviews" ? (
						<span className="text-xs text-base-content/60 flex items-center gap-0.5">
							<i className="fa-solid fa-star text-warning text-[10px]" />
							{teacher.rating}
						</span>
					) : (
						<span className="text-xs text-base-content/40 italic">New</span>
					)}
				</div>

				{isSelected && (
					<i className="fa-solid fa-circle-check text-primary shrink-0" />
				)}
			</div>
		</button>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RequestClassForm({
	initialTeacher,
	initialStartTime,
	initialDuration,
	studyBoostActive = false,
	priorityBookingActive = false,
}: {
	initialTeacher?: InitialTeacher;
	initialStartTime?: string;
	initialDuration?: number;
	studyBoostActive?: boolean;
	priorityBookingActive?: boolean;
}) {
	const [phase, setPhase] = useState<Phase>("details");

	// ── Phase 1 state ───────────────────────────────────────────────────────────
	const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
	const [selectedSubject, setSelectedSubject] = useState(() => {
		// Auto-select if pre-loaded teacher has exactly one subject
		if (initialTeacher?.subjects.length === 1) return initialTeacher.subjects[0].id;
		return "";
	});
	const [selectedSubjectName, setSelectedSubjectName] = useState(() => {
		if (initialTeacher?.subjects.length === 1) return initialTeacher.subjects[0].name;
		return "";
	});
	const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime ?? "");
	const [selectedDuration, setSelectedDuration] = useState(initialDuration ?? 1);

	// ── Phase 2 state ───────────────────────────────────────────────────────────
	const [teacherOptions, setTeacherOptions] = useState<TeacherBookingOption[]>([]);
	const [loadingTeachers, setLoadingTeachers] = useState(false);
	const [bookingMode, setBookingMode] = useState<"ondemand" | "specific">(
		initialTeacher ? "specific" : "ondemand",
	);
	const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacher?.id ?? "");
	const [selectedTeacherName, setSelectedTeacherName] = useState(initialTeacher?.name ?? "");
	const [selectedTeacherPrice, setSelectedTeacherPrice] = useState<string | null>(null);

	// ── Phase 3 state ───────────────────────────────────────────────────────────
	const [preAuth, setPreAuth] = useState<PreAuthState | null>(null);

	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const minStartDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);

	// Load subjects
	useEffect(() => {
		const list = initialTeacher ? initialTeacher.subjects : null;
		if (list) {
			setSubjects(list);
		} else {
			fetchSubjectsWithTeachers().then(setSubjects);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Estimated price for specific booking
	const estimatedPrice = useMemo(() => {
		if (!selectedTeacherPrice || bookingMode !== "specific") return null;
		return (parseFloat(selectedTeacherPrice) * selectedDuration).toFixed(2);
	}, [selectedTeacherPrice, selectedDuration, bookingMode]);

	const discountedPrice = estimatedPrice
		? (parseFloat(estimatedPrice) * 0.95).toFixed(2)
		: null;

	// ── Phase handlers ───────────────────────────────────────────────────────────

	async function handlePhase1Submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!selectedSubject) { setError("Please select a subject."); return; }
		if (!selectedStartTime) { setError("Please select a start time."); return; }

		setLoadingTeachers(true);
		try {
			const options = await fetchTeachersForBooking(
				selectedSubject,
				selectedStartTime,
				selectedDuration,
			);
			setTeacherOptions(options);

			// If pre-selected teacher, pull their price from results
			if (initialTeacher?.id) {
				const found = options.find((t) => t.id === initialTeacher.id);
				if (found) setSelectedTeacherPrice(found.pricePerHour);
			}
		} catch {
			setError("Failed to load teachers. Please try again.");
			return;
		} finally {
			setLoadingTeachers(false);
		}
		setPhase("teacher");
	}

	function handleOnDemand() {
		setError(null);
		const fd = new FormData();
		fd.set("subject", selectedSubject);
		fd.set("startTime", selectedStartTime);
		fd.set("duration", String(selectedDuration));
		startTransition(async () => {
			const result = await createClassAsStudent(undefined, fd);
			if (result) setError(result);
		});
	}

	function handleBookSpecific() {
		if (!selectedTeacherId) return;
		setError(null);
		startTransition(async () => {
			const res = await fetch("/api/payment-intent/pre-auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					teacherId: selectedTeacherId,
					durationInHours: selectedDuration,
					startTime: selectedStartTime,
				}),
			});
			const json = await res.json();
			if (json.error) { setError(json.error); return; }
			setPreAuth({
				clientSecret: json.clientSecret,
				intentId: json.intentId,
				totalPrice: json.totalPrice,
				teacherName: selectedTeacherName,
				classData: {
					subjectId: selectedSubject,
					teacherId: selectedTeacherId,
					startTime: selectedStartTime,
					durationInHours: selectedDuration,
				},
			});
			setPhase("payment");
		});
	}

	// ── Phase 3: Payment ─────────────────────────────────────────────────────────

	if (phase === "payment" && preAuth) {
		return (
			<div className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300 animate-fade-in">
				<StepIndicator phase="payment" />
				<h2 className="text-xl font-semibold text-center mb-6">Authorize Payment</h2>
				<PreAuthForm
					clientSecret={preAuth.clientSecret}
					totalPrice={preAuth.totalPrice}
					classData={preAuth.classData}
					teacherName={preAuth.teacherName}
					onBack={() => { setPhase("teacher"); setPreAuth(null); }}
				/>
			</div>
		);
	}

	// ── Phase 2: Teacher picker ───────────────────────────────────────────────────

	if (phase === "teacher") {
		const available = teacherOptions.filter((t) => t.isAvailable);
		const others    = teacherOptions.filter((t) => !t.isAvailable);

		return (
			<div className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300 animate-fade-in">
				<StepIndicator phase="teacher" />
				<h2 className="text-xl font-semibold text-center mb-4">Choose a Teacher</h2>

				{/* Editable summary */}
				<button
					type="button"
					onClick={() => setPhase("details")}
					className="w-full flex items-center justify-between px-4 py-3 bg-base-200 rounded-xl mb-5 hover:bg-base-300 transition-colors text-left group"
				>
					<p className="text-sm">
						<span className="font-medium capitalize">{selectedSubjectName}</span>
						<span className="text-base-content/60">
							{" "}· {fmtDateTime(selectedStartTime)} · {fmtDuration(selectedDuration)}
						</span>
					</p>
					<span className="text-xs text-primary group-hover:underline shrink-0 ml-3">
						Edit
					</span>
				</button>

				{error && (
					<div role="alert" className="alert alert-error text-sm mb-4">
						<i className="fa-solid fa-triangle-exclamation shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<div className="flex flex-col gap-3">
					{/* On-demand card */}
					<button
						type="button"
						onClick={() => {
							setBookingMode("ondemand");
							setSelectedTeacherId("");
							setSelectedTeacherName("");
							setSelectedTeacherPrice(null);
						}}
						className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
							bookingMode === "ondemand"
								? "border-primary bg-primary/10"
								: "border-base-300 hover:border-primary/40"
						}`}
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
								<i className="fa-solid fa-bolt text-warning text-lg" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-semibold text-sm">On-Demand</p>
								<p className="text-xs text-base-content/60">
									{priorityBookingActive
										? "Your request will be shown first to available teachers."
										: "Broadcast to all available teachers. First to accept gets the class."}
								</p>
							</div>
							{bookingMode === "ondemand" && (
								<i className="fa-solid fa-circle-check text-primary shrink-0" />
							)}
						</div>
					</button>

					{/* Available teachers */}
					{available.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-semibold text-base-content/40 uppercase tracking-wide px-1 mt-1">
								Available at your time
							</p>
							{available.map((t) => (
								<TeacherCard
									key={t.id}
									teacher={t}
									isSelected={bookingMode === "specific" && selectedTeacherId === t.id}
									onSelect={() => {
										setBookingMode("specific");
										setSelectedTeacherId(t.id);
										setSelectedTeacherName(t.name);
										setSelectedTeacherPrice(t.pricePerHour);
									}}
								/>
							))}
						</div>
					)}

					{/* Other teachers */}
					{others.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-xs font-semibold text-base-content/40 uppercase tracking-wide px-1 mt-1">
								Other teachers
							</p>
							{others.map((t) => (
								<TeacherCard
									key={t.id}
									teacher={t}
									isSelected={bookingMode === "specific" && selectedTeacherId === t.id}
									onSelect={() => {
										setBookingMode("specific");
										setSelectedTeacherId(t.id);
										setSelectedTeacherName(t.name);
										setSelectedTeacherPrice(t.pricePerHour);
									}}
								/>
							))}
						</div>
					)}

					{teacherOptions.length === 0 && (
						<p className="text-sm text-base-content/50 italic text-center py-4">
							No teachers found for this subject.
						</p>
					)}
				</div>

				{/* Estimated price */}
				{bookingMode === "specific" && estimatedPrice && (
					<div className="flex justify-between items-center px-4 py-3 bg-base-200 rounded-xl text-sm mt-4 animate-fade-in">
						<span className="text-base-content/60">Estimated total</span>
						{studyBoostActive ? (
							<span className="flex items-center gap-2 font-bold text-lg">
								<span className="line-through text-base-content/40 text-base font-normal">
									{estimatedPrice}€
								</span>
								{discountedPrice}€
								<span className="badge badge-success badge-sm">-5%</span>
							</span>
						) : (
							<span className="font-bold text-lg">{estimatedPrice}€</span>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center gap-3 mt-5">
					<button
						type="button"
						className="btn btn-ghost btn-sm gap-2"
						onClick={() => setPhase("details")}
					>
						<i className="fa-solid fa-arrow-left" />
						Back
					</button>
					<div className="flex-1" />
					{bookingMode === "ondemand" ? (
						<button
							type="button"
							className="btn btn-primary gap-2"
							disabled={isPending}
							onClick={handleOnDemand}
						>
							{isPending
								? <span className="loading loading-spinner loading-sm" />
								: <><i className="fa-solid fa-bolt" />Find me a teacher</>
							}
						</button>
					) : (
						<button
							type="button"
							className="btn btn-primary gap-2"
							disabled={isPending || !selectedTeacherId}
							onClick={handleBookSpecific}
						>
							{isPending
								? <span className="loading loading-spinner loading-sm" />
								: <><i className="fa-solid fa-arrow-right" />Continue to Payment</>
							}
						</button>
					)}
				</div>
			</div>
		);
	}

	// ── Phase 1: Details ──────────────────────────────────────────────────────────

	return (
		<div className="w-full max-w-xl p-6 bg-base-100 shadow-lg rounded-xl border border-base-300 animate-fade-in">
			<StepIndicator phase="details" />
			<h2 className="text-xl font-semibold text-center mb-4">
				{initialTeacher ? `Book a class with ${initialTeacher.name}` : "Schedule a Class"}
			</h2>

			<form onSubmit={handlePhase1Submit} className="flex flex-col gap-5">
				{error && (
					<div role="alert" className="alert alert-error text-sm">
						<i className="fa-solid fa-triangle-exclamation shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<SubjectSelect
					subjects={subjects}
					selectedSubject={selectedSubject}
					onSelectSubject={(id) => {
						setSelectedSubject(id);
						setSelectedSubjectName(subjects.find((s) => s.id === id)?.name ?? "");
					}}
				/>

				<StartTimeInput
					minDate={minStartDate}
					defaultValue={initialStartTime}
					onChange={setSelectedStartTime}
				/>

				<DurationSelect
					durations={DURATIONS}
					defaultValue={initialDuration}
					onChange={setSelectedDuration}
				/>

				<div className="flex items-center gap-4 mt-2">
					<button
						type="submit"
						className="btn btn-primary flex-grow gap-2"
						disabled={loadingTeachers}
					>
						{loadingTeachers
							? <span className="loading loading-spinner loading-sm" />
							: <><i className="fa-solid fa-arrow-right" />Find Available Teachers</>
						}
					</button>
					<GoBackButton url="/main/student/classes" />
				</div>
			</form>
		</div>
	);
}

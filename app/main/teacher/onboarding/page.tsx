"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/lib/actions/users.actions";

// ── Step data ──────────────────────────────────────────────────────────────────

const TEACHING_STYLES = [
	{
		value: "structured",
		label: "Structured",
		icon: "fa-list-check",
		description: "A clear syllabus and step-by-step progression",
	},
	{
		value: "socratic",
		label: "Socratic",
		icon: "fa-comments",
		description: "Guided questions that lead students to the answer",
	},
	{
		value: "hands-on",
		label: "Hands-on",
		icon: "fa-flask",
		description: "Practice-heavy — learn by doing",
	},
	{
		value: "exam-focused",
		label: "Exam-Focused",
		icon: "fa-graduation-cap",
		description: "Targeted preparation for tests and exams",
	},
];

// ── Option card (mirrors app/main/student/onboarding/page.tsx) ────────────────

function OptionCard({
	icon,
	label,
	description,
	selected,
	onClick,
}: {
	icon: string;
	label: string;
	description: string;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-start ${
				selected
					? "border-secondary bg-secondary/10"
					: "border-base-300 bg-base-100 hover:border-secondary/40"
			}`}
		>
			<span
				className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm ${
					selected
						? "bg-secondary text-secondary-content"
						: "bg-base-200 text-base-content/60"
				}`}
			>
				<i className={`fa-solid ${icon}`} />
			</span>
			<span className="flex flex-col gap-0.5">
				<span className="font-semibold text-sm">{label}</span>
				<span className="text-xs text-base-content/60">{description}</span>
			</span>
			{selected && (
				<span className="ml-auto shrink-0 text-secondary">
					<i className="fa-solid fa-circle-check" />
				</span>
			)}
		</button>
	);
}

function StepDots({ total, current }: { total: number; current: number }) {
	return (
		<div className="flex gap-2 justify-center">
			{Array.from({ length: total }).map((_, i) => (
				<span
					key={i}
					className={`h-1.5 rounded-full transition-all ${
						i === current ? "w-6 bg-secondary" : "w-1.5 bg-base-300"
					}`}
				/>
			))}
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TeacherOnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [teachingStyle, setTeachingStyle] = useState("");
	const [pricePerHour, setPricePerHour] = useState("");
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const STEPS = 2;
	const priceValue = parseFloat(pricePerHour);
	const priceIsValid = pricePerHour !== "" && !Number.isNaN(priceValue) && priceValue > 0;

	function handleSkip() {
		router.push("/main/teacher/dashboard");
	}

	function handleFinish() {
		if (!teachingStyle || !priceIsValid) return;
		setError(null);
		startTransition(async () => {
			// updateProfile requires name fields — empty strings mean "don't
			// change them" (the action merges, not overwrites; see
			// app/main/student/onboarding/page.tsx for the same pattern).
			const result = await updateProfile({
				firstName: "",
				lastName: "",
				teachingStyle,
				pricePerHour: priceValue,
			});
			if (result.error) {
				setError(result.error);
			} else {
				router.push("/main/teacher/dashboard");
			}
		});
	}

	return (
		<div className="flex min-h-[80vh] items-center justify-center py-8">
			<div className="w-full max-w-lg p-8 bg-base-100 shadow-lg rounded-2xl border border-base-300 animate-fade-in">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
						<i className="fa-solid fa-chalkboard-user text-secondary text-lg" />
					</div>
					<h1 className="text-xl font-bold">Set up your teaching profile</h1>
					<p className="text-sm text-base-content/60 mt-1">
						A couple of quick questions so students know what to expect.
					</p>
				</div>

				<StepDots total={STEPS} current={step} />

				<div className="mt-8">
					{/* Step 0: Teaching style */}
					{step === 0 && (
						<div className="animate-fade-in flex flex-col gap-4">
							<h2 className="font-semibold text-base text-center mb-1">
								What&apos;s your teaching style?
							</h2>
							{TEACHING_STYLES.map((opt) => (
								<OptionCard
									key={opt.value}
									icon={opt.icon}
									label={opt.label}
									description={opt.description}
									selected={teachingStyle === opt.value}
									onClick={() => setTeachingStyle(opt.value)}
								/>
							))}
						</div>
					)}

					{/* Step 1: Price per hour */}
					{step === 1 && (
						<div className="animate-fade-in flex flex-col gap-4">
							<h2 className="font-semibold text-base text-center mb-1">
								What do you charge per hour?
							</h2>
							<p className="text-xs text-base-content/50 text-center -mt-2">
								You can change this any time from your profile.
							</p>
							<label className="input input-bordered flex items-center gap-2 max-w-xs mx-auto">
								<input
									type="number"
									min={0}
									step={0.01}
									className="grow"
									placeholder="0.00"
									value={pricePerHour}
									onChange={(e) => setPricePerHour(e.target.value)}
								/>
								<span className="text-base-content/50">€ / hour</span>
							</label>
						</div>
					)}
				</div>

				{error && (
					<div role="alert" className="alert alert-error text-sm mt-4 py-2">
						<i className="fa-solid fa-triangle-exclamation" />
						<span>{error}</span>
					</div>
				)}

				{/* Navigation */}
				<div className="flex items-center justify-between mt-8 gap-3">
					<button
						type="button"
						className="btn btn-ghost btn-sm text-base-content/40"
						onClick={handleSkip}
					>
						Skip for now
					</button>

					<div className="flex gap-2">
						{step > 0 && (
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={() => setStep((s) => s - 1)}
								disabled={isPending}
							>
								<i className="fa-solid fa-arrow-left" /> Back
							</button>
						)}

						{step < STEPS - 1 ? (
							<button
								type="button"
								className="btn btn-secondary btn-sm"
								onClick={() => setStep((s) => s + 1)}
								disabled={!teachingStyle}
							>
								Next <i className="fa-solid fa-arrow-right" />
							</button>
						) : (
							<button
								type="button"
								className="btn btn-secondary btn-sm"
								onClick={handleFinish}
								disabled={!priceIsValid || isPending}
							>
								{isPending ? (
									<span className="loading loading-spinner loading-xs" />
								) : (
									<>
										<i className="fa-solid fa-check" /> Save & Continue
									</>
								)}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

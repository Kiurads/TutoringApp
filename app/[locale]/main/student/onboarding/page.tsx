"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/lib/actions/users.actions";

// ── Step data ──────────────────────────────────────────────────────────────────

const LEARNING_STYLES = [
	{
		value: "visual",
		label: "Visual",
		icon: "fa-eye",
		description: "Diagrams, charts, written notes, and structured explanations",
	},
	{
		value: "discussion",
		label: "Discussion",
		icon: "fa-comments",
		description: "Talking through ideas, Q&A, and collaborative exploration",
	},
	{
		value: "practice",
		label: "Practice",
		icon: "fa-pen-ruler",
		description: "Exercises, problem-solving, and learning by doing",
	},
];

const GOALS = [
	{
		value: "exam_prep",
		label: "Exam Preparation",
		icon: "fa-graduation-cap",
		description: "Get ready for an upcoming test or exam",
	},
	{
		value: "mastery",
		label: "Deep Mastery",
		icon: "fa-brain",
		description: "Truly understand the subject from the ground up",
	},
	{
		value: "homework",
		label: "Homework Help",
		icon: "fa-book-open",
		description: "Get unstuck and work through assignments",
	},
	{
		value: "general",
		label: "General Improvement",
		icon: "fa-chart-line",
		description: "Build skills and confidence over time",
	},
];

// ── Option card ────────────────────────────────────────────────────────────────

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
					? "border-primary bg-primary/10"
					: "border-base-300 bg-base-100 hover:border-primary/40"
			}`}
		>
			<span
				className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm ${
					selected
						? "bg-primary text-primary-content"
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
				<span className="ml-auto shrink-0 text-primary">
					<i className="fa-solid fa-circle-check" />
				</span>
			)}
		</button>
	);
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
	return (
		<div className="flex gap-2 justify-center">
			{Array.from({ length: total }).map((_, i) => (
				<span
					key={i}
					className={`h-1.5 rounded-full transition-all ${
						i === current ? "w-6 bg-primary" : "w-1.5 bg-base-300"
					}`}
				/>
			))}
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [learningStyle, setLearningStyle] = useState("");
	const [learningGoal, setLearningGoal] = useState("");
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const STEPS = 2;

	function handleSkip() {
		// See app/main/student/dashboard/page.tsx: ?tour=1 is what lets a
		// first-time student actually reach the dashboard (and its welcome
		// tour) instead of being redirected straight back here.
		router.push("/main/student/dashboard?tour=1");
	}

	function handleFinish() {
		if (!learningStyle || !learningGoal) return;
		setError(null);
		startTransition(async () => {
			// updateProfile requires name fields — we pass empty strings so the
			// action only updates the fields we provide (it merges, not overwrites)
			const result = await updateProfile({
				firstName: "", // placeholder — server action fetches real values first
				lastName: "",  // placeholder
				learningStyle,
				learningGoal,
			});
			if (result.error) {
				setError(result.error);
			} else {
				router.push("/main/student/dashboard?tour=1");
			}
		});
	}

	return (
		<div className="flex min-h-[80vh] items-center justify-center py-8">
			<div className="w-full max-w-lg p-8 bg-base-100 shadow-lg rounded-2xl border border-base-300 animate-fade-in">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
						<i className="fa-solid fa-wand-magic-sparkles text-primary text-lg" />
					</div>
					<h1 className="text-xl font-bold">Personalise your experience</h1>
					<p className="text-sm text-base-content/60 mt-1">
						A few quick questions so we can find your best matches.
					</p>
				</div>

				<StepDots total={STEPS} current={step} />

				<div className="mt-8">
					{/* Step 0: Learning style */}
					{step === 0 && (
						<div className="animate-fade-in flex flex-col gap-4">
							<h2 className="font-semibold text-base text-center mb-1">
								How do you learn best?
							</h2>
							{LEARNING_STYLES.map((opt) => (
								<OptionCard
									key={opt.value}
									icon={opt.icon}
									label={opt.label}
									description={opt.description}
									selected={learningStyle === opt.value}
									onClick={() => setLearningStyle(opt.value)}
								/>
							))}
						</div>
					)}

					{/* Step 1: Goal */}
					{step === 1 && (
						<div className="animate-fade-in flex flex-col gap-3">
							<h2 className="font-semibold text-base text-center mb-1">
								What&apos;s your main goal?
							</h2>
							{GOALS.map((opt) => (
								<OptionCard
									key={opt.value}
									icon={opt.icon}
									label={opt.label}
									description={opt.description}
									selected={learningGoal === opt.value}
									onClick={() => setLearningGoal(opt.value)}
								/>
							))}
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
								className="btn btn-primary btn-sm"
								onClick={() => setStep((s) => s + 1)}
								disabled={!learningStyle}
							>
								Next <i className="fa-solid fa-arrow-right" />
							</button>
						) : (
							<button
								type="button"
								className="btn btn-primary btn-sm"
								onClick={handleFinish}
								disabled={!learningGoal || isPending}
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

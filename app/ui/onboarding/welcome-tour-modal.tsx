"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingTour } from "@/app/lib/actions/onboarding.actions";

interface Slide {
	icon: string;
	title: string;
	body: string;
}

function buildSlides(role: "student" | "teacher", firstName: string): Slide[] {
	const intro: Slide = {
		icon: "fa-hand-sparkles",
		title: `Welcome, ${firstName}!`,
		body:
			role === "student"
				? "Let's take a quick look around The Learning Nexus before you get started."
				: "Let's take a quick look around before you start teaching on The Learning Nexus.",
	};

	const middle: Slide =
		role === "student"
			? {
					icon: "fa-chalkboard-user",
					title: "Find the right teacher",
					body: "Browse subjects or search teachers directly, then book a class — either on-demand or with a teacher you pick yourself.",
				}
			: {
					icon: "fa-calendar-check",
					title: "Manage your classes",
					body: "Accept or counter-offer class requests, set your weekly availability, and track everything from your dashboard.",
				};

	const rewards: Slide = {
		icon: "fa-gem",
		title: role === "student" ? "Earn Insight Gems" : "Earn Reputation Sparks",
		body:
			role === "student"
				? "Every class you complete earns gems, builds a weekly streak, and unlocks badges — spend gems on profile frames and boosts in the Gem Store."
				: "Every class you teach earns sparks, builds a weekly streak, and unlocks badges as you climb the Mentorship ranks.",
	};

	return [intro, middle, rewards];
}

export default function WelcomeTourModal({
	role,
	firstName,
}: {
	role: "student" | "teacher";
	firstName: string;
}) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [step, setStep] = useState(0);
	const [isPending, startTransition] = useTransition();

	const slides = buildSlides(role, firstName);
	const isLastSlide = step === slides.length - 1;
	const slide = slides[step];

	// Always shown once mounted — the parent server component only renders
	// this at all when hasCompletedOnboarding is false, so there's no
	// separate "isOpen" prop to drive visibility.
	useEffect(() => {
		dialogRef.current?.showModal();
	}, []);

	function finish(destination?: string) {
		startTransition(async () => {
			await completeOnboardingTour();
			dialogRef.current?.close();
			if (destination) router.push(destination);
			else router.refresh();
		});
	}

	const preferencesHref =
		role === "student" ? "/main/student/onboarding" : "/main/teacher/onboarding";

	return (
		<dialog
			ref={dialogRef}
			className="modal"
			// Dismissing via Escape counts the same as "Skip" — this is a
			// one-time welcome tour, not something to nag the user with again.
			onClose={() => finish()}
		>
			<div className="modal-box max-w-md text-center">
				<div className="text-5xl text-primary mb-4">
					<i className={`fa-solid ${slide.icon}`}></i>
				</div>
				<h3 className="font-bold text-lg mb-2">{slide.title}</h3>
				<p className="text-base-content/70 text-sm mb-6">{slide.body}</p>

				{/* Step indicator */}
				<div className="flex justify-center gap-1.5 mb-6">
					{slides.map((_, i) => (
						<div
							key={i}
							className={`h-1.5 rounded-full transition-all ${
								i === step ? "w-6 bg-primary" : "w-1.5 bg-base-300"
							}`}
						/>
					))}
				</div>

				{!isLastSlide ? (
					<div className="flex gap-3">
						<button
							className="btn btn-ghost flex-1"
							onClick={() => finish()}
							disabled={isPending}
						>
							Skip for now
						</button>
						<button
							className="btn btn-primary flex-1"
							onClick={() => setStep((s) => s + 1)}
						>
							Next
						</button>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<button
							className="btn btn-primary w-full"
							onClick={() => finish(preferencesHref)}
							disabled={isPending}
						>
							{isPending ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Set up my preferences"
							)}
						</button>
						<button
							className="btn btn-ghost btn-sm w-full"
							onClick={() => finish()}
							disabled={isPending}
						>
							I&apos;ll do this later
						</button>
					</div>
				)}
			</div>
			<div className="modal-backdrop" onClick={() => finish()} />
		</dialog>
	);
}

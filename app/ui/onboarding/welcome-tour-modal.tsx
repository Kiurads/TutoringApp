"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { completeOnboardingTour } from "@/app/lib/actions/onboarding.actions";

function buildSteps(role: "student" | "teacher", firstName: string): DriveStep[] {
	const intro: DriveStep = {
		popover: {
			title: `Welcome, ${firstName}!`,
			description:
				role === "student"
					? "Let's take a quick look around The Learning Nexus before you get started."
					: "Let's take a quick look around before you start teaching on The Learning Nexus.",
		},
	};

	const middle: DriveStep =
		role === "student"
			? {
					element: '[data-tour="nav-teachers"]',
					popover: {
						title: "Find the right teacher",
						description:
							"Browse subjects or search teachers directly, then book a class — either on-demand or with a teacher you pick yourself.",
						side: "right",
					},
				}
			: {
					element: '[data-tour="nav-classes"]',
					popover: {
						title: "Manage your classes",
						description:
							"Accept or counter-offer class requests, set your weekly availability, and track everything from your dashboard.",
						side: "right",
					},
				};

	// Only students get a "destination" here: a teacher has already filled in
	// their teaching preferences before ever reaching this tour (middleware
	// forces that first), so there's nothing left to send them to — this step
	// just finishes the tour in place. See auth.config.ts's `authorized`
	// callback for the enforcement that guarantees that ordering.
	const rewards: DriveStep =
		role === "student"
			? {
					element: '[data-tour="academic-arc-widget"]',
					popover: {
						title: "Earn Insight Gems",
						description:
							"Every class you complete earns gems, builds a weekly streak, and unlocks badges — spend gems on profile frames and boosts in the Gem Store.",
						side: "top",
						doneBtnText: "Set up my preferences",
					},
					data: { destination: "/main/student/onboarding" },
				}
			: {
					element: '[data-tour="mentor-milestones-widget"]',
					popover: {
						title: "Earn Reputation Sparks",
						description:
							"Every class you teach earns sparks, builds a weekly streak, and unlocks badges as you climb the Mentorship ranks.",
						side: "top",
						doneBtnText: "Let's get started",
					},
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

	useEffect(() => {
		function finish(destination?: string) {
			(async () => {
				await completeOnboardingTour();
				if (destination) router.push(destination);
				router.refresh();
			})();
		}

		// Effect cleanup (e.g. React StrictMode's dev-mode double-invoke, or
		// this component unmounting because the route changed) also tears
		// down the driver instance, which fires onDestroyed just like a real
		// user dismissal. This flag tells onDestroyed to ignore that case.
		let isCleanupDestroy = false;

		const driverObj = driver({
			showProgress: true,
			// Students can dismiss the tour at any point (X button, overlay
			// click, Escape). Teachers cannot — the tour is mandatory, so the
			// only way through is clicking the "Done" button on the last step.
			allowClose: role === "student",
			stagePadding: 6,
			stageRadius: 8,
			steps: buildSteps(role, firstName),
			onDestroyed: (_element, step) => {
				if (isCleanupDestroy) return;
				finish(step?.data?.destination as string | undefined);
			},
		});

		driverObj.drive();

		return () => {
			isCleanupDestroy = true;
			driverObj.destroy();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { completeOnboardingTour } from "@/app/lib/actions/onboarding.actions";

// By the time this tour plays, preferences are already handled for both
// roles — teachers are forced through /main/teacher/onboarding first (see
// auth.config.ts), and students are routed there first too (see
// app/main/student/dashboard/page.tsx's ?tour=1 handoff), whether they filled
// it in or skipped it. So every step here talks about actual mechanics of the
// app rather than generic "here's a feature" copy, and nothing points back
// to the preferences form.
function buildSteps(role: "student" | "teacher", firstName: string): DriveStep[] {
	if (role === "student") {
		return [
			{
				popover: {
					title: `Welcome, ${firstName}!`,
					description:
						"Four quick stops and you'll know exactly how to book classes and earn rewards here.",
				},
			},
			{
				element: '[data-tour="next-up-card"]',
				popover: {
					title: "Your next class, always in view",
					description:
						"This card tracks whichever session is coming up next with a live countdown — click into it for the video link and details once it's about to start.",
					side: "bottom",
				},
			},
			{
				element: '[data-tour="nav-teachers"]',
				popover: {
					title: "Two ways to book a class",
					description:
						"Browse Teachers directly and request a specific time, or open Subjects to find who teaches what you need — either way you can propose a time or ask for the next on-demand slot.",
					side: "right",
				},
			},
			{
				element: '[data-tour="academic-arc-widget"]',
				popover: {
					title: "Gems, tiers, and streaks",
					description:
						"Every completed class earns Insight Gems and keeps your weekly streak going. Streaks are forgiving — bank a Streak Freeze from the Gem Store before a week you know you'll miss.",
					side: "top",
				},
			},
			{
				element: '[data-tour="weekly-quests-widget"]',
				popover: {
					title: "Weekly quests reset every Monday",
					description:
						"Simple goals — like completing 2 classes or leaving a review — earn bonus gems on top of the usual rewards. Unclaimed quests don't roll over, so check back each week.",
					side: "top",
					doneBtnText: "Let's get started",
				},
			},
		];
	}

	return [
		{
			popover: {
				title: `Welcome, ${firstName}!`,
				description:
					"Four quick stops and you'll know exactly how classes, ranks, and rewards work here.",
			},
		},
		{
			element: '[data-tour="online-toggle"]',
			popover: {
				title: "Go online when you're free to teach",
				description:
					"Only teachers marked Online show up for on-demand class requests — flip this whenever you're available, and back off when you're not, so students only ever see real openings.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-classes"]',
			popover: {
				title: "Requests, and your recurring hours",
				description:
					"Accept or counter-offer incoming class requests from here. Right below it, Availability lets you set your recurring weekly hours so requests only come in when you're actually free.",
				side: "right",
			},
		},
		{
			element: '[data-tour="mentor-milestones-widget"]',
			popover: {
				title: "Sparks, rank, and streaks",
				description:
					"Every class you teach earns Reputation Sparks, and 5-star reviews help you climb Mentorship ranks. Teach at least once a week to keep your streak alive.",
				side: "top",
			},
		},
		{
			element: '[data-tour="weekly-quests-widget"]',
			popover: {
				title: "Weekly quests reset every Monday",
				description:
					"Simple goals — like teaching 3 classes this week — earn bonus sparks on top of the usual rewards. Unclaimed quests don't roll over, so check back each week.",
				side: "top",
				doneBtnText: "Let's get started",
			},
		},
	];
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
		function finish() {
			(async () => {
				await completeOnboardingTour();
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
			onDestroyed: () => {
				if (isCleanupDestroy) return;
				finish();
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

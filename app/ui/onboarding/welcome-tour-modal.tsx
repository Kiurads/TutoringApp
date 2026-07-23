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
//
// This walks the sidebar top to bottom, one step per nav item, since a
// generic 3-4 step highlight-reel wasn't enough to actually orient a new
// user — every link needs its own one-line explanation of what it's for.
function buildSteps(role: "student" | "teacher", firstName: string): DriveStep[] {
	const intro: DriveStep = {
		popover: {
			title: `Welcome, ${firstName}!`,
			description:
				role === "student"
					? "Here's a quick tour of everything in your sidebar, plus how gems and streaks work."
					: "Here's a quick tour of everything in your sidebar, plus how sparks and streaks work.",
		},
	};

	if (role === "student") {
		return [
			intro,
			{
				element: '[data-tour="nav-dashboard"]',
				popover: {
					title: "Dashboard",
					description:
						"You're here — your next class, Insight Gems, weekly streak, and quests all in one place.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-classes"]',
				popover: {
					title: "Classes",
					description: "Every class you've booked: upcoming, in progress, and completed.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-recurring-classes"]',
				popover: {
					title: "Recurring Classes",
					description:
						"Set up a standing weekly slot with a teacher instead of booking one class at a time.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-calendar"]',
				popover: {
					title: "Calendar",
					description: "The same classes laid out on a calendar grid, handy for spotting free days.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-subjects"]',
				popover: {
					title: "Subjects",
					description: "Browse by what you want to learn to see every teacher who teaches it.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-teachers"]',
				popover: {
					title: "Teachers",
					description:
						"Search and browse teacher profiles directly, then request a class or propose a time.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-store"]',
				popover: {
					title: "Gem Store",
					description:
						"Spend Insight Gems here on profile frames and boosts, like Streak Freezes that protect your streak through a busy week.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-profile"]',
				popover: {
					title: "Profile",
					description: "Your account details, bio, and avatar.",
					side: "right",
				},
			},
			{
				element: '[data-tour="nav-preferences"]',
				popover: {
					title: "Preferences",
					description: "Your learning style and goals — come back any time to change them.",
					side: "right",
				},
			},
			{
				element: '[data-tour="weekly-quests-widget"]',
				popover: {
					title: "One more thing: Weekly Quests",
					description:
						"These reset every Monday — simple goals like completing 2 classes or leaving a review earn bonus gems. Unclaimed quests don't roll over.",
					side: "top",
					doneBtnText: "Let's get started",
				},
			},
		];
	}

	return [
		intro,
		{
			element: '[data-tour="online-toggle"]',
			popover: {
				title: "Go online when you're free to teach",
				description:
					"Only teachers marked Online show up for on-demand class requests — flip this whenever you're available, and back off when you're not.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-dashboard"]',
			popover: {
				title: "Dashboard",
				description:
					"You're here — your next class, Reputation Sparks, mentorship rank, and weekly streak all in one place.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-classes"]',
			popover: {
				title: "Classes",
				description:
					"Incoming class requests land here — accept them as-is or send a counter-offer with a different time or price.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-recurring-classes"]',
			popover: {
				title: "Recurring Classes",
				description:
					"Set up a standing weekly slot with a student instead of one-off bookings.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-calendar"]',
			popover: {
				title: "Calendar",
				description: "The same classes laid out on a calendar grid.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-availability"]',
			popover: {
				title: "Availability",
				description:
					"Set your recurring weekly hours so class requests only come in when you're actually free.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-students"]',
			popover: {
				title: "Students",
				description: "Every student you've taught, with their class history.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-earnings"]',
			popover: {
				title: "Earnings",
				description: "What you've been paid, and what's still pending.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-payouts"]',
			popover: {
				title: "Payouts",
				description:
					"Connect a Stripe account here so your share of each class gets transferred to you automatically.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-refund-requests"]',
			popover: {
				title: "Refund Requests",
				description: "Review and respond to refund requests a student has raised for one of your classes.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-profile"]',
			popover: {
				title: "Profile",
				description: "Your account details, bio, and avatar.",
				side: "right",
			},
		},
		{
			element: '[data-tour="nav-preferences"]',
			popover: {
				title: "Preferences",
				description: "Your teaching style and hourly rate — come back any time to change them.",
				side: "right",
			},
		},
		{
			element: '[data-tour="weekly-quests-widget"]',
			popover: {
				title: "One more thing: Weekly Quests",
				description:
					"These reset every Monday — a goal like teaching 3 classes this week earns bonus sparks. Unclaimed quests don't roll over.",
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

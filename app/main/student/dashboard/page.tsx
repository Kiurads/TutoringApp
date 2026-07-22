import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/app/ui/main/dashboard/header";
import UpcomingClasses from "@/app/ui/main/dashboard/upcoming-classes/upcoming-classes";
import StudentPayments from "@/app/ui/main/dashboard/student-payments";
import NextUpCard from "@/app/ui/main/dashboard/next-up-card";
import AcademicArcWidget from "@/app/ui/main/dashboard/academic-arc-widget";
import WeeklyQuestsWidget from "@/app/ui/main/dashboard/weekly-quests-widget";
import WelcomeTourModal from "@/app/ui/onboarding/welcome-tour-modal";
import { fetchPaymentsByUserId } from "@/app/lib/actions/paymets.actions";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import Link from "next/link";

export default async function DashboardStudent() {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const userEmail = session.user.email!;
	const [payments, user] = await Promise.all([
		fetchPaymentsByUserId(userEmail),
		fetchUserByEmail(userEmail),
	]);

	const needsOnboarding = user && !user.learningStyle;

	return (
		<div className="flex flex-col gap-6">
			{user && !user.hasCompletedOnboarding && (
				<WelcomeTourModal role="student" firstName={user.firstName} />
			)}

			<DashboardHeader userEmail={userEmail} />

			{/* Onboarding CTA */}
			{needsOnboarding && (
				<div role="alert" className="alert shadow-sm animate-fade-in">
					<i className="fa-solid fa-wand-magic-sparkles text-primary text-lg shrink-0" />
					<div className="flex-1">
						<p className="font-semibold text-sm">Personalise your experience</p>
						<p className="text-xs text-base-content/60">
							Tell us your learning style and goals — we&apos;ll use it to recommend the best teachers for you.
						</p>
					</div>
					<Link href="/main/student/onboarding" className="btn btn-primary btn-sm shrink-0">
						Get started
					</Link>
				</div>
			)}

			{/* Top row: Next Up + Academic Arc */}
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="w-full lg:basis-1/2">
					<NextUpCard userEmail={userEmail} />
				</div>
				<div className="w-full lg:basis-1/2">
					<AcademicArcWidget userEmail={userEmail} />
				</div>
			</div>

			{/* Bottom row: Upcoming classes + Payments */}
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="w-full lg:basis-3/5">
					<UpcomingClasses userEmail={userEmail} />
				</div>
				<div className="w-full lg:basis-2/5 flex flex-col gap-6">
					<StudentPayments payments={payments} />
					<WeeklyQuestsWidget />
				</div>
			</div>
		</div>
	);
}

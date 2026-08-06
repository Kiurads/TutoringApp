import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/app/ui/main/dashboard/header";
import UpcomingClasses from "@/app/ui/main/dashboard/upcoming-classes/upcoming-classes";
import TeacherEarnings from "@/app/ui/main/dashboard/teacher-earnings";
import NextUpCard from "@/app/ui/main/dashboard/next-up-card";
import MentorMilestonesWidget from "@/app/ui/main/dashboard/mentor-milestones-widget";
import WeeklyQuestsWidget from "@/app/ui/main/dashboard/weekly-quests-widget";
import WelcomeTourModal from "@/app/ui/onboarding/welcome-tour-modal";
import { fetchPaymentsByTeacherId } from "@/app/lib/actions/paymets.actions";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";

export default async function DashboardTeacher() {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const userEmail = session.user.email!;
	const [payments, user] = await Promise.all([
		fetchPaymentsByTeacherId(userEmail),
		fetchUserByEmail(userEmail),
	]);

	return (
		<div className="flex flex-col gap-6">
			{user && !user.hasCompletedOnboarding && (
				<WelcomeTourModal role="teacher" firstName={user.firstName} />
			)}

			{user && user.connectStatus !== "active" && (
				<div role="alert" className="alert alert-warning shadow-sm">
					<i className="fa-solid fa-triangle-exclamation" />
					<span>
						You haven&apos;t set up payouts yet — set up Stripe to get paid automatically for
						your classes.
					</span>
					<Link href="/main/teacher/payouts" className="btn btn-sm btn-warning">
						Set up payouts
					</Link>
				</div>
			)}

			<DashboardHeader userEmail={userEmail} />

			{/* Top row: Next Up + Mentor Milestones */}
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="w-full lg:basis-1/2">
					<NextUpCard userEmail={userEmail} />
				</div>
				<div className="w-full lg:basis-1/2">
					<MentorMilestonesWidget userEmail={userEmail} />
				</div>
			</div>

			{/* Bottom row: Upcoming classes + Earnings */}
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="w-full lg:basis-3/5">
					<UpcomingClasses userEmail={userEmail} />
				</div>
				<div className="w-full lg:basis-2/5 flex flex-col gap-6">
					<TeacherEarnings payments={payments} />
					<WeeklyQuestsWidget />
				</div>
			</div>
		</div>
	);
}

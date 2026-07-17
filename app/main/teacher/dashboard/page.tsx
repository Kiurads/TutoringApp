import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/app/ui/main/dashboard/header";
import UpcomingClasses from "@/app/ui/main/dashboard/upcoming-classes/upcoming-classes";
import TeacherEarnings from "@/app/ui/main/dashboard/teacher-earnings";
import NextUpCard from "@/app/ui/main/dashboard/next-up-card";
import MentorMilestonesWidget from "@/app/ui/main/dashboard/mentor-milestones-widget";
import { fetchPaymentsByTeacherId } from "@/app/lib/actions/paymets.actions";

export default async function DashboardTeacher() {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const userEmail = session.user.email!;
	const payments = await fetchPaymentsByTeacherId(userEmail);

	return (
		<div className="flex flex-col gap-6">
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
				<div className="w-full lg:basis-2/5">
					<TeacherEarnings payments={payments} />
				</div>
			</div>
		</div>
	);
}

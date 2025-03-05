import { auth } from "@/auth";
import DashboardHeader from "@/app/ui/main/dashboard/header";
import UpcomingClasses from "@/app/ui/main/dashboard/upcoming-classes/upcoming-classes";
import StudentPayments from "@/app/ui/main/dashboard/student-payments";
import { fetchPaymentsByUserId } from "@/app/lib/actions/paymets.actions";
import { fetchClassSubjectsBySelf } from "@/app/lib/actions/classes.actions";
// import ClassSubjectChart from "@/app/ui/main/dashboard/class-subject-chart";

export default async function DashboardStudent() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const userEmail = session.user.email;

	// Fetch user payments on the server
	const payments = await fetchPaymentsByUserId(userEmail);
	// const subjects = await fetchClassSubjectsBySelf();

	return (
		<div className="flex flex-col items-center gap-2 justify-start w-full">
			{/* Header */}
			<div className="w-full pt-4 px-4 sm:px-8 lg:px-12">
				<DashboardHeader userEmail={userEmail} />
			</div>

			{/* Main Content */}
			<div className="flex flex-col md:flex-row w-full px-4 sm:px-8 lg:px-12 py-4 gap-4">
				{/* First Section - Upcoming Classes */}
				<div className="w-full pb-4 md:pb-0 md:basis-1/2 lg:basis-3/5">
					<UpcomingClasses userEmail={userEmail} />
				</div>

				{/* Second Section - Student Payments */}
				<div className="w-full md:basis-1/2 lg:basis-2/5">
					<StudentPayments payments={payments} />
				</div>
			</div>

			{/* Pie Chart Section - Classes per Subject */}
			{/* <div className="flex flex-col md:flex-row w-full px-4 sm:px-8 lg:px-12 py-4 gap-4">
				<div className="w-full">
					<div className="w-full max-w-lg">
						<ClassSubjectChart classes={subjects} />
					</div>
				</div>
			</div> */}
		</div>
	);
}

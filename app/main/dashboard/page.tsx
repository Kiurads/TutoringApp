import { auth } from "@/auth";

import DashboardHeader from "@/app/ui/main/dashboard/header";
import UpcomingClasses from "@/app/ui/main/dashboard/upcoming-classes/upcoming-classes";

export default async function DashboardStudent() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const userEmail = session.user.email;

	return (
		<div className="flex flex-col items-center gap-2 justify-start w-full">
			{/* Header */}
			<div className="w-full pt-4 px-4 sm:px-8 lg:px-12">
				<DashboardHeader userEmail={userEmail} />
			</div>

			{/* Main Content */}
			<div className="flex flex-col md:flex-row w-full px-4 sm:px-8 lg:px-12 py-4 gap-4">
				{/* First Section */}
				<div className="w-full pb-4 md:pb-0 md:basis-1/2 lg:basis-3/5">
					<UpcomingClasses userEmail={userEmail} />
				</div>

				{/* Second Section */}
				<div className="w-full md:basis-1/2 lg:basis-2/5">
					{/* Add your dashboard content here */}
				</div>
			</div>
		</div>
	);
}

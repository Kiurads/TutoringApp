import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { fetchAvailability } from "@/app/lib/actions/availability.actions";
import AvailabilityGrid from "@/app/ui/main/availability/availability-grid";

export default async function TeacherAvailabilityPage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const user = await fetchUserByEmail(session.user.email);
	if (!user) redirect("/login");

	const slots = await fetchAvailability(user.id);

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">Availability</h1>
				<p className="text-base-content/60 mt-1">
					Set the times you&apos;re available to teach each week. Students will see
					these slots when browsing your profile.
				</p>
			</div>

			<div className="card bg-base-200 shadow-lg animate-fade-in">
				<div className="card-body gap-4">
					<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Weekly schedule
					</h2>
					<AvailabilityGrid initialSlots={slots} />
				</div>
			</div>
		</div>
	);
}

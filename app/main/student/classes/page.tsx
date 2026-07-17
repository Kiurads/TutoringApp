"use server";

import { fetchBookedClassesByUser } from "@/app/lib/actions/classes.actions";
import BookedClasses from "@/app/ui/main/classes/student-booked-classes";
import FirstVisitWarning from "@/app/ui/main/classes/first-visit-warning";
import ToastNotification from "@/app/ui/main/classes/toast-notification";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ClassesPage(props: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const { toast } = await props.searchParams;
	const bookedClasses = await fetchBookedClassesByUser(session.user.email);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">My Classes</h1>
				<p className="text-base-content/60 mt-1">
					View and manage your scheduled sessions
				</p>
			</div>
			<ToastNotification toast={toast} />
			<FirstVisitWarning />
			<BookedClasses bookedClasses={bookedClasses} />
		</div>
	);
}

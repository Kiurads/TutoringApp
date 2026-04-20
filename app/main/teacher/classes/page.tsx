"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
	fetchBookedClassesByUser,
	fetchOpenRequestsForTeacher,
} from "@/app/lib/actions/classes.actions";
import BookedClasses from "@/app/ui/main/classes/teacher-booked-classes";
import OpenRequests from "@/app/ui/main/classes/open-requests";
import ToastNotification from "@/app/ui/main/classes/toast-notification";

export default async function TeacherClassesPage(props: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const userEmail = session.user.email!;
	const { toast } = await props.searchParams;

	const [bookedClasses, openRequests] = await Promise.all([
		fetchBookedClassesByUser(userEmail),
		fetchOpenRequestsForTeacher(userEmail),
	]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">My Classes</h1>
				<p className="text-base-content/60 mt-1">
					Manage your teaching schedule and class requests
				</p>
			</div>
			<ToastNotification toast={toast} />
			<OpenRequests requests={openRequests} />
			<BookedClasses bookedClasses={bookedClasses} />
		</div>
	);
}

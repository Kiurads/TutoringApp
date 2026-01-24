"use server";

import { fetchBookedClassesByUser } from "@/app/lib/actions/classes.actions";
import BookedClasses from "@/app/ui/main/classes/teacher-booked-classes";
import { auth } from "@/auth";

export default async function TeacherClassesPage() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const userEmail = session.user.email;
	const bookedClasses = await fetchBookedClassesByUser(userEmail);

	return (
		<div className="flex flex-col md:flex-row w-full px-2 sm:px-2 lg:px-4 py-4 gap-4">
			<div className="flex-grow">
				<div className="mb-4">
					<h1 className="text-3xl font-bold">My Classes</h1>
					<p className="text-base-content/70">
						Manage your teaching schedule and class requests
					</p>
				</div>
				<BookedClasses bookedClasses={bookedClasses} />
			</div>
		</div>
	);
}

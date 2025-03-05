"use server";

import { fetchBookedClassesByUser } from "@/app/lib/actions/classes.actions";
import BookedClasses from "@/app/ui/main/classes/booked-classes";
import { auth } from "@/auth";

export default async function ClassesPage() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const userEmail = session.user.email;
	const bookedClasses = await fetchBookedClassesByUser(userEmail);

	console.log(bookedClasses);

	return (
		<div className="flex flex-col md:flex-row w-full px-2 sm:px-2 lg:px-4 py-4 gap-4">
			<div className="flex-grow">
				<BookedClasses bookedClasses={bookedClasses} />
			</div>
		</div>
	);
}

"use server";

import { fetchRegularClassesByTeacher } from "@/app/lib/actions/regular-classes.actions";
import RegularClassesTable from "@/app/ui/main/regular-classes/regular-classes-table";
import ToastNotification from "@/app/ui/main/classes/toast-notification";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TeacherRegularClassesPage(props: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { toast } = await props.searchParams;
	const regularClasses = await fetchRegularClassesByTeacher(session.user.email);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Recurring Classes</h1>
				<p className="text-base-content/60 mt-1">
					Weekly recurring class requests and series
				</p>
			</div>
			<ToastNotification toast={toast} />
			<RegularClassesTable regularClasses={regularClasses} role="teacher" />
		</div>
	);
}

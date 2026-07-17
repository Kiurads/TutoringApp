"use server";

import { fetchRegularClassesByStudent } from "@/app/lib/actions/regular-classes.actions";
import RegularClassesTable from "@/app/ui/main/regular-classes/regular-classes-table";
import ToastNotification from "@/app/ui/main/classes/toast-notification";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentRegularClassesPage(props: {
	searchParams: Promise<{ toast?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { toast } = await props.searchParams;
	const regularClasses = await fetchRegularClassesByStudent(session.user.email);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Recurring Classes</h1>
					<p className="text-base-content/60 mt-1">
						Manage your weekly recurring class series
					</p>
				</div>
				<Link href="/main/student/regular-classes/request" className="btn btn-primary gap-2">
					<i className="fa-solid fa-plus"></i> New Recurring Class
				</Link>
			</div>
			<ToastNotification toast={toast} />
			<RegularClassesTable regularClasses={regularClasses} role="student" />
		</div>
	);
}

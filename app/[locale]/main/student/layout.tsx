import { auth } from "@/auth";
import { fetchNotificationsForUser } from "@/app/lib/actions/notifications.actions";
import { buildAvatarDataUri, parseAvatarOptions } from "@/app/lib/avatar-utils";
import prisma from "@/prisma";
import StudentSidebar from "./_components/StudentSidebar";

export default async function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const userEmail = session?.user?.email ?? "";

	const [notifications, userData] = await Promise.all([
		userEmail ? fetchNotificationsForUser(userEmail) : Promise.resolve([]),
		userEmail
			? prisma.user.findUnique({
				where: { email: userEmail },
				select: { firstName: true, avatarOptions: true },
			})
			: Promise.resolve(null),
	]);

	const avatarDataUri = buildAvatarDataUri(
		userEmail,
		parseAvatarOptions(userData?.avatarOptions ?? null),
	);

	return (
		<StudentSidebar
			userEmail={userEmail}
			firstName={userData?.firstName ?? ""}
			avatarDataUri={avatarDataUri}
			initialNotifications={notifications}
		>
			{children}
		</StudentSidebar>
	);
}

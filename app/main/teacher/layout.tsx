import { auth } from "@/auth";
import { getTeacherOnlineStatus } from "@/app/lib/actions/teachers.actions";
import { fetchNotificationsForUser } from "@/app/lib/actions/notifications.actions";
import { buildAvatarDataUri, parseAvatarOptions } from "@/app/lib/avatar-utils";
import prisma from "@/prisma";
import TeacherSidebar from "./_components/TeacherSidebar";

export default async function TeacherLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();
	const userEmail = session?.user?.email ?? "";

	const [isOnline, notifications, userData] = await Promise.all([
		userEmail ? getTeacherOnlineStatus(userEmail) : Promise.resolve(false),
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
		<TeacherSidebar
			userEmail={userEmail}
			firstName={userData?.firstName ?? ""}
			avatarDataUri={avatarDataUri}
			initialIsOnline={isOnline}
			initialNotifications={notifications}
		>
			{children}
		</TeacherSidebar>
	);
}

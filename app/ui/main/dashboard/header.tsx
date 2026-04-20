import { fetchClassesByUser } from "@/app/lib/actions/classes.actions";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { getFrameClass } from "@/app/lib/frame-utils";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";

export default async function DashboardHeader(props: { userEmail: string }) {
	const user = await fetchUserByEmail(props.userEmail);

	if (!user) {
		return <div>User not found.</div>;
	}

	const classes = await fetchClassesByUser(user);

	const activeFrame = user.studentGameProfile?.activeFrame ?? null;
	const frameClass = user.role === "student" ? getFrameClass(activeFrame) : "";

	return (
		<div className="card bg-base-200 shadow-lg overflow-hidden">
			<div className="card-body">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<span className="badge badge-primary capitalize">{user.role}</span>
						<h3 className="card-title text-2xl mt-1">
							Welcome back, {user.firstName}!
						</h3>
						<p className="text-sm text-base-content/60">{user.email}</p>
					</div>
					<div className={`hidden sm:block shrink-0 rounded-lg ${frameClass}`}>
						<Image
							alt=""
							width={64}
							height={64}
							src={getAvatar(user.email, user.avatarOptions)} unoptimized
							className="size-16 rounded-lg object-cover shadow-sm"
						/>
					</div>
				</div>

				<div className="flex gap-6 mt-2 pt-3 border-t border-base-300">
					<div>
						<p className="text-xs text-base-content/60">Member since</p>
						<p className="text-sm font-medium">
							{user.createdAt.toLocaleDateString("en-us", {
								year: "numeric",
								month: "short",
								day: "numeric",
							})}
						</p>
					</div>
					<div>
						<p className="text-xs text-base-content/60">Total classes</p>
						<p className="text-sm font-medium">{classes.length}</p>
					</div>
				</div>
			</div>
			<span className="h-1 bg-gradient-to-r from-primary via-accent to-secondary"></span>
		</div>
	);
}

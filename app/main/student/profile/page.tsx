import { auth } from "@/auth";
import { fetchUserByEmail, fetchAllBadges, fetchEarnedBadges } from "@/app/lib/actions/users.actions";
import ProfileForm from "@/app/ui/main/users/profile-form";
import BadgeShowcase from "@/app/ui/main/badges/badge-showcase";
import { getTierName, getTierProgress, calcTier } from "@/app/lib/gamification-utils";
import { getFrameClass } from "@/app/lib/frame-utils";
import AvatarCustomizer from "@/app/ui/main/users/avatar-customizer";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const user = await fetchUserByEmail(session.user.email);
	if (!user) redirect("/login");

	const [allBadges, earnedBadges] = await Promise.all([
		fetchAllBadges(),
		fetchEarnedBadges(user.id),
	]);

	const studentBadges = allBadges.filter(
		(b) => b.category === "milestone" || b.category === "engagement",
	);

	const fields = [user.firstName, user.lastName, user.bio, user.learningStyle, user.learningGoal];
	const filled = fields.filter(Boolean).length;
	const pct = Math.round((filled / fields.length) * 100);

	const gems = user.studentGameProfile?.insightGems ?? 0;
	const activeFrame = user.studentGameProfile?.activeFrame ?? null;
	const frameClass = getFrameClass(activeFrame);
	const tier = calcTier(gems);
	const tierName = getTierName(tier);
	const { current, next, pct: tierPct } = getTierProgress(gems);

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">My Profile</h1>
				<p className="text-base-content/60 mt-1">
					Update your personal details and learning preferences.
				</p>
			</div>

			{/* Two-column layout on large screens */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 items-start">

				{/* ── Left column: avatar + form ── */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Avatar + name header */}
					<div className="card bg-base-200 shadow-lg overflow-hidden">
						<div className="h-20 bg-gradient-to-r from-primary/40 via-primary/15 to-transparent" />
						<div className="card-body pt-0 flex-row items-end gap-4 -mt-9">
							<div className="relative shrink-0">
								<div className={`rounded-2xl ${frameClass || "ring-4 ring-base-200"}`}>
									<Image
										src={getAvatar(user.email, user.avatarOptions)} unoptimized
										alt=""
										width={80}
										height={80}
										className="size-20 rounded-2xl object-cover shadow"
									/>
								</div>
								<AvatarCustomizer
									email={user.email}
									avatarOptionsJson={user.avatarOptions ?? null}
								/>
							</div>
							<div className="pb-1 flex-1 min-w-0">
								<p className="font-bold text-xl leading-tight truncate">
									{user.firstName} {user.lastName}
								</p>
								<p className="text-sm text-base-content/50 truncate">{user.email}</p>
							</div>
							<div className="pb-1 hidden sm:flex flex-col items-end gap-1 shrink-0">
								<span className="text-xs text-base-content/50 font-medium">Profile {pct}% complete</span>
								<div className="w-28 h-1.5 rounded-full bg-base-300 overflow-hidden">
									<div
										className="h-full rounded-full bg-primary transition-all"
										style={{ width: `${pct}%` }}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Edit form */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-2">
							<div className="flex items-center gap-2 mb-2">
								<i className="fa-solid fa-pen-to-square text-primary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Personal details
								</h2>
							</div>
							<ProfileForm
								role="student"
								initialData={{
									firstName: user.firstName,
									lastName: user.lastName,
									bio: user.bio,
									learningStyle: user.learningStyle,
									learningGoal: user.learningGoal,
									teachingStyle: null,
									pricePerHour: null,
								}}
							/>
						</div>
					</div>
				</div>

				{/* ── Right column: gems + badges ── */}
				<div className="flex flex-col gap-6">
					{/* Gem & tier card */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-4">
							<div className="flex items-center gap-2">
								<i className="fa-solid fa-gem text-primary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Academic Arc
								</h2>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold">{gems.toLocaleString()}</p>
									<p className="text-xs text-base-content/50">Insight Gems</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold">{tierName}</p>
									<p className="text-xs text-base-content/40">Current tier</p>
								</div>
							</div>

							{tier < 4 && (
								<div className="flex flex-col gap-1">
									<div className="flex justify-between text-xs text-base-content/50">
										<span>{current.toLocaleString()} / {next.toLocaleString()} to next tier</span>
										<span>{tierPct}%</span>
									</div>
									<div className="w-full h-2 rounded-full bg-base-300 overflow-hidden">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${tierPct}%` }}
										/>
									</div>
								</div>
							)}

							<Link href="/main/student/store" className="btn btn-outline btn-primary btn-sm gap-2 w-full">
								<i className="fa-solid fa-gem text-xs"></i>
								Visit Gem Store
							</Link>
						</div>
					</div>

					{/* Badge showcase */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-3">
							<div className="flex items-center gap-2">
								<i className="fa-solid fa-trophy text-warning"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Badges
								</h2>
								<span className="ml-auto badge badge-warning badge-outline text-xs">
									{earnedBadges.length} / {studentBadges.length}
								</span>
							</div>
							<BadgeShowcase allBadges={studentBadges} earnedBadges={earnedBadges} />
						</div>
					</div>
				</div>

			</div>
		</div>
	);
}

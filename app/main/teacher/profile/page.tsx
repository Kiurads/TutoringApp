import { auth } from "@/auth";
import { fetchUserByEmail, fetchAllBadges, fetchEarnedBadges } from "@/app/lib/actions/users.actions";
import { fetchSubjects, fetchSubjectsByTeacherId } from "@/app/lib/actions/subjects.actions";
import ProfileForm from "@/app/ui/main/users/profile-form";
import ChangePasswordForm from "@/app/ui/main/users/change-password-form";
import TeacherSubjectsForm from "@/app/ui/main/users/teacher-subjects-form";
import BadgeShowcase from "@/app/ui/main/badges/badge-showcase";
import { getRankName, getRankProgress, calcRank } from "@/app/lib/gamification-utils";
import AvatarCustomizer from "@/app/ui/main/users/avatar-customizer";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeacherProfilePage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const user = await fetchUserByEmail(session.user.email);
	if (!user) redirect("/login");

	const [allBadges, earnedBadges, allSubjects, teacherSubjects] = await Promise.all([
		fetchAllBadges(),
		fetchEarnedBadges(user.id),
		fetchSubjects(),
		fetchSubjectsByTeacherId(user.id),
	]);
	const teacherSubjectIds = teacherSubjects.map((s) => s.id);

	const teacherBadges = allBadges.filter(
		(b) => b.category === "milestone" || b.category === "expertise" || b.category === "pedagogy",
	);

	const fields = [user.firstName, user.lastName, user.bio, user.teachingStyle, user.pricePerHour];
	const filled = fields.filter(Boolean).length;
	const pct = Math.round((filled / fields.length) * 100);
	const isComplete = pct === 100;

	const sparks = user.teacherGameProfile?.reputationSparks ?? 0;
	const rank = calcRank(sparks);
	const rankName = getRankName(rank);
	const { current, next, pct: rankPct } = getRankProgress(sparks);

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">My Profile</h1>
				<p className="text-base-content/60 mt-1">
					Keep your profile complete to attract more students and earn Reputation Sparks.
				</p>
			</div>

			{/* Two-column layout on large screens */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 items-start">

				{/* ── Left column: avatar + form ── */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Avatar + name header */}
					<div className="card bg-base-200 shadow-lg overflow-hidden">
						<div className="h-20 bg-gradient-to-r from-secondary/40 via-secondary/15 to-transparent" />
						<div className="card-body pt-0 flex-row items-end gap-4 -mt-9">
							<div className="relative shrink-0">
								<div className="ring-4 ring-base-200 rounded-2xl">
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
							<div className="pb-1 hidden sm:flex flex-col items-end gap-1.5 shrink-0">
								{!isComplete && (
									<span className="badge badge-warning badge-outline text-xs gap-1">
										<i className="fa-solid fa-star text-warning text-[10px]"></i>
										+150 sparks on first save
									</span>
								)}
								<span className="text-xs text-base-content/50 font-medium">Profile {pct}% complete</span>
								<div className="w-28 h-1.5 rounded-full bg-base-300 overflow-hidden">
									<div
										className="h-full rounded-full bg-secondary transition-all"
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
								<i className="fa-solid fa-pen-to-square text-secondary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Personal details
								</h2>
							</div>
							<ProfileForm
								role="teacher"
								initialData={{
									firstName: user.firstName,
									lastName: user.lastName,
									bio: user.bio,
									learningStyle: null,
									learningGoal: null,
									teachingStyle: user.teachingStyle,
									pricePerHour: user.pricePerHour ? Number(user.pricePerHour) : null,
								}}
							/>
						</div>
					</div>

					{/* Subjects taught */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-2">
							<div className="flex items-center gap-2 mb-2">
								<i className="fa-solid fa-book text-secondary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Subjects taught
								</h2>
							</div>
							<TeacherSubjectsForm
								allSubjects={allSubjects}
								initialSubjectIds={teacherSubjectIds}
							/>
						</div>
					</div>

					{/* Change password */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-2">
							<div className="flex items-center gap-2 mb-2">
								<i className="fa-solid fa-lock text-secondary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Change password
								</h2>
							</div>
							<ChangePasswordForm />
						</div>
					</div>
				</div>

				{/* ── Right column: sparks + seals ── */}
				<div className="flex flex-col gap-6">
					{/* Sparks & rank card */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-4">
							<div className="flex items-center gap-2">
								<i className="fa-solid fa-bolt text-secondary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Mentor Milestones
								</h2>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold">{sparks.toLocaleString()}</p>
									<p className="text-xs text-base-content/50">Reputation Sparks</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-semibold">{rankName}</p>
									<p className="text-xs text-base-content/40">Current rank</p>
								</div>
							</div>

							{rank < 4 && (
								<div className="flex flex-col gap-1">
									<div className="flex justify-between text-xs text-base-content/50">
										<span>{current.toLocaleString()} / {next.toLocaleString()} to next rank</span>
										<span>{rankPct}%</span>
									</div>
									<div className="w-full h-2 rounded-full bg-base-300 overflow-hidden">
										<div
											className="h-full rounded-full bg-secondary transition-all"
											style={{ width: `${rankPct}%` }}
										/>
									</div>
								</div>
							)}

							<Link href="/main/teacher/availability" className="btn btn-outline btn-secondary btn-sm gap-2 w-full">
								<i className="fa-solid fa-calendar-week text-xs"></i>
								Manage Availability
							</Link>
						</div>
					</div>

					{/* Seal & badge showcase */}
					<div className="card bg-base-200 shadow-lg">
						<div className="card-body gap-3">
							<div className="flex items-center gap-2">
								<i className="fa-solid fa-shield-halved text-secondary"></i>
								<h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
									Seals &amp; Milestones
								</h2>
								<span className="ml-auto badge badge-secondary badge-outline text-xs">
									{earnedBadges.length} / {teacherBadges.length}
								</span>
							</div>
							<BadgeShowcase allBadges={teacherBadges} earnedBadges={earnedBadges} />
						</div>
					</div>
				</div>

			</div>
		</div>
	);
}

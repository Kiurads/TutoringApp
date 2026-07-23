import prisma from "@/prisma";
import { fetchUserByEmail } from "@/app/lib/actions/users.actions";
import { getTierName, getTierProgress } from "@/app/lib/gamification-utils";

export default async function AcademicArcWidget({
	userEmail,
}: {
	userEmail: string;
}) {
	const user = await fetchUserByEmail(userEmail);
	if (!user) return null;

	const profile = await prisma.studentGameProfile.findUnique({
		where: { userId: user.id },
	});

	const gems = profile?.insightGems ?? 0;
	const tier = profile?.learningTier ?? 0;
	const tierName = getTierName(tier);
	const progress = getTierProgress(gems);
	const isMaxTier = tier >= 4;
	const currentStreak = profile?.currentStreakWeeks ?? 0;
	const streakFreezes = profile?.streakFreezes ?? 0;

	const recentBadges = await prisma.userBadge.findMany({
		where: { userId: user.id },
		orderBy: { earnedAt: "desc" },
		take: 3,
		include: { badge: true },
	});

	return (
		<div className="card bg-base-200 shadow-lg" data-tour="academic-arc-widget">
			<div className="card-body gap-4">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Academic Arc
					</h3>
					<span className="badge badge-primary badge-outline text-xs">
						{tierName}
					</span>
				</div>

				{/* Gems balance */}
				<div className="flex items-center gap-2">
					<i className="fa-solid fa-gem text-info text-lg"></i>
					<span className="text-2xl font-bold">{gems.toLocaleString()}</span>
					<span className="text-base-content/50 text-sm">Insight Gems</span>
				</div>

				{/* Weekly activity streak */}
				{currentStreak > 0 && (
					<div className="flex items-center gap-2 text-sm">
						<i className="fa-solid fa-fire text-warning"></i>
						<span className="font-semibold">{currentStreak}-week streak</span>
						{streakFreezes > 0 && (
							<span className="badge badge-info badge-outline badge-sm gap-1">
								<i className="fa-solid fa-snowflake text-[10px]"></i>
								{streakFreezes}
							</span>
						)}
					</div>
				)}

				{/* Tier progress */}
				{!isMaxTier && (
					<div className="flex flex-col gap-1">
						<div className="flex justify-between text-xs text-base-content/50">
							<span>{progress.current} / {progress.next} gems to next tier</span>
							<span>{progress.pct}%</span>
						</div>
						<progress
							className="progress progress-primary w-full"
							value={progress.pct}
							max={100}
						/>
					</div>
				)}
				{isMaxTier && (
					<p className="text-xs text-success font-medium">
						<i className="fa-solid fa-check-circle mr-1"></i>Max tier reached!
					</p>
				)}

				{/* Recent badges */}
				{recentBadges.length > 0 && (
					<div className="flex flex-col gap-2">
						<p className="text-xs text-base-content/50">Recent badges</p>
						<div className="flex gap-2 flex-wrap">
							{recentBadges.map((ub) => (
								<div
									key={ub.id}
									className="tooltip"
									data-tip={ub.badge.name}
								>
									<div className="badge badge-outline gap-1 py-3">
										<i className={`fa-solid ${ub.badge.iconKey} text-primary`}></i>
										<span className="text-xs">{ub.badge.name}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{recentBadges.length === 0 && (
					<p className="text-xs text-base-content/40">
						Complete classes to earn badges.
					</p>
				)}
			</div>
		</div>
	);
}

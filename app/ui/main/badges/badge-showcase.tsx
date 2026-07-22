import { Badge, UserBadge } from "@prisma/client";

interface Props {
	allBadges: Badge[];
	earnedBadges: (UserBadge & { badge: Badge })[];
	compact?: boolean; // compact mode shows fewer columns and no descriptions
}

const CATEGORY_LABEL: Record<string, string> = {
	milestone: "Milestones",
	engagement: "Engagement",
	subject: "Subject Mastery",
	expertise: "Expertise",
	pedagogy: "Pedagogy",
};

export default function BadgeShowcase({ allBadges, earnedBadges, compact = false }: Props) {
	const earnedIds = new Set(earnedBadges.map((ub) => ub.badgeId));
	const earnedMap = new Map(earnedBadges.map((ub) => [ub.badgeId, ub]));

	const categories = [
		...new Set(allBadges.map((b) => b.category)),
	] as string[];

	if (compact) {
		return (
			<div className="flex flex-wrap gap-2">
				{earnedBadges.map((ub) => (
					<div
						key={ub.id}
						className="tooltip"
						data-tip={ub.badge.name}
					>
						<div
							className="flex items-center justify-center w-9 h-9 rounded-xl bg-warning/15 text-warning text-lg shadow-sm"
							role="img"
							aria-label={ub.badge.name}
							tabIndex={0}
						>
							<i className={`fa-solid ${ub.badge.iconKey}`}></i>
						</div>
					</div>
				))}
				{earnedBadges.length === 0 && (
					<p className="text-sm text-base-content/40">No badges yet.</p>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{categories.map((cat) => {
				const badges = allBadges.filter((b) => b.category === cat);
				if (badges.length === 0) return null;

				return (
					<div key={cat}>
						<p className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3">
							{CATEGORY_LABEL[cat] ?? cat}
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{badges.map((badge) => {
								const earned = earnedIds.has(badge.id);
								const ub = earnedMap.get(badge.id);

								return (
									<div
										key={badge.id}
										className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
											earned
												? "bg-warning/10 border-warning/30"
												: "bg-base-300/30 border-base-300/30 opacity-40 grayscale cursor-default select-none"
										}`}
									>
										<div
											className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-xl ${
												earned ? "bg-warning/20 text-warning" : "bg-base-300 text-base-content/30"
											}`}
										>
											<i className={`fa-solid ${badge.iconKey}`}></i>
										</div>
										<div className="flex-1 min-w-0">
											<p className={`text-sm font-semibold leading-tight ${earned ? "" : "text-base-content/50"}`}>
												{badge.name}
											</p>
											<p className="text-xs text-base-content/50 mt-0.5 leading-snug">
												{badge.description}
											</p>
											{earned && ub && (
												<p className="text-[10px] text-base-content/30 mt-1">
													{new Date(ub.earnedAt).toLocaleDateString("en-GB", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

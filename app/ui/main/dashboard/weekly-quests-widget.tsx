import { fetchWeeklyQuests } from "@/app/lib/quests";
import ClaimQuestButton from "./claim-quest-button";

export default async function WeeklyQuestsWidget() {
	const quests = await fetchWeeklyQuests();
	if (quests.length === 0) return null;

	return (
		<div className="card bg-base-200 shadow-lg" data-tour="weekly-quests-widget">
			<div className="card-body gap-4">
				<div className="flex items-center gap-2">
					<i className="fa-solid fa-flag-checkered text-secondary"></i>
					<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
						Weekly Quests
					</h3>
				</div>

				<div className="flex flex-col gap-3">
					{quests.map((q) => (
						<div key={q.key} className="flex items-center gap-3">
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-medium">{q.title}</p>
									<span className="text-xs text-base-content/50 shrink-0">
										{q.progress}/{q.target}
									</span>
								</div>
								<p className="text-xs text-base-content/50 mt-0.5">{q.description}</p>
								<progress
									className={`progress w-full mt-1.5 ${q.completed ? "progress-success" : "progress-secondary"}`}
									value={q.progress}
									max={q.target}
								/>
							</div>
							<ClaimQuestButton
								questKey={q.key}
								completed={q.completed}
								claimed={q.claimed}
								reward={q.reward}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

import { STORE_ITEMS } from "@/app/lib/store-catalog";
import { fetchStudentStoreState } from "@/app/lib/actions/store.actions";
import { getFrameClass, getFrameLabel, getFrameColor } from "@/app/lib/frame-utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PurchaseButton from "@/app/ui/main/store/purchase-button";
import EquipFrameButton from "@/app/ui/main/store/equip-frame-button";
import Image from "next/image";
import getAvatar from "@/utils/get-avatar";

export default async function StorePage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const { gems, ownedFrames, activeFrame, studyBoostActive, priorityBooking, avatarOptions } =
		await fetchStudentStoreState();

	const cosmetics = STORE_ITEMS.filter((i) => i.category === "cosmetic");
	const boosts = STORE_ITEMS.filter((i) => i.category === "boost");

	function isOwned(key: string, frameKey?: string): boolean {
		if (key === "study_boost") return studyBoostActive;
		if (key === "priority_booking") return priorityBooking;
		if (frameKey) return ownedFrames.includes(frameKey);
		return false;
	}

	function ownedLabel(key: string): string {
		if (key === "study_boost") return "Active";
		if (key === "priority_booking") return "Active";
		return "Owned";
	}

	const allFrameKeys = ["scholar", "luminary", "sage"];

	return (
		<div className="flex justify-center">
			<div className="flex flex-col gap-8 w-full max-w-2xl animate-fade-in">

				{/* Header + balance */}
				<div className="card bg-gradient-to-br from-primary/20 via-primary/5 to-base-200 shadow-lg border border-primary/10">
					<div className="card-body py-5 flex-row items-center gap-4">
						<div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 shrink-0">
							<i className="fa-solid fa-gem text-primary text-2xl"></i>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
								Your Gem Balance
							</p>
							<p className="text-3xl font-bold">
								{gems.toLocaleString()}
								<span className="text-base font-normal text-base-content/50 ml-1">gems</span>
							</p>
						</div>
						<div className="hidden sm:flex flex-col items-end gap-1 text-right shrink-0">
							<p className="text-xs text-base-content/50">Earn more by</p>
							<p className="text-xs text-base-content/70 font-medium">completing classes</p>
						</div>
					</div>
				</div>

				{/* Active boosts banner */}
				{(studyBoostActive || priorityBooking) && (
					<div role="alert" className="alert alert-success text-sm py-3 animate-fade-in">
						<i className="fa-solid fa-bolt"></i>
						<div>
							<p className="font-semibold">Active boosts</p>
							<ul className="list-disc list-inside text-xs mt-0.5 text-base-content/70">
								{studyBoostActive && <li>Study Boost — 5% off your next class</li>}
								{priorityBooking && <li>Priority Match — your next on-demand request is prioritised</li>}
							</ul>
						</div>
					</div>
				)}

				{/* My Collection — only shown when student owns at least one frame */}
				{ownedFrames.length > 0 && (
					<section className="flex flex-col gap-3">
						<p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
							My Collection
						</p>
						<div className="card bg-base-200 shadow-sm border border-base-300">
							<div className="card-body py-5 gap-5">
								{/* Avatar preview */}
								<div className="flex flex-col items-center gap-3">
									<p className="text-xs text-base-content/50 uppercase tracking-wide font-medium">Preview</p>
									<div className={`rounded-2xl ${getFrameClass(activeFrame) || "ring-4 ring-base-300"}`}>
										<Image
											src={getAvatar(session.user.email, avatarOptions)} unoptimized
											alt="Your avatar"
											width={80}
											height={80}
											className="size-20 rounded-2xl object-cover"
										/>
									</div>
									<p className="text-sm font-medium">
										{activeFrame
											? <span className={getFrameColor(activeFrame)}>{getFrameLabel(activeFrame)}</span>
											: <span className="text-base-content/40">No frame equipped</span>}
									</p>
								</div>

								{/* Frame swatches with equip buttons */}
								<div className="flex flex-col gap-2">
									{allFrameKeys.map((fk) => {
										const owned = ownedFrames.includes(fk);
										const isActive = fk === activeFrame;
										if (!owned) return null;
										return (
											<div
												key={fk}
												className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
													isActive ? "bg-base-300" : "bg-base-100 hover:bg-base-300/50"
												}`}
											>
												{/* Swatch */}
												<div className={`w-9 h-9 rounded-full bg-base-200 ${getFrameClass(fk)} shrink-0`} />
												<div className="flex-1 min-w-0">
													<p className={`text-sm font-semibold ${getFrameColor(fk)}`}>
														{getFrameLabel(fk)}
													</p>
												</div>
												<EquipFrameButton frameKey={fk} isActive={isActive} />
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</section>
				)}

				{/* Profile Frames shop section */}
				<section className="flex flex-col gap-3">
					<p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
						Profile Frames
					</p>
					<div className="flex flex-col gap-3">
						{cosmetics.map((item) => {
							const owned = isOwned(item.key, item.frameKey);
							const isActive = item.frameKey === activeFrame;
							return (
								<div
									key={item.key}
									className={`card shadow-sm transition-shadow ${
										isActive
											? "bg-base-200 border border-primary/30 shadow-md"
											: "bg-base-200 hover:shadow-md"
									}`}
								>
									<div className="card-body py-4 flex-row items-center gap-4">
										{/* Frame preview swatch */}
										<div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-base-300 ${
											item.frameKey ? getFrameClass(item.frameKey) : ""
										}`}>
											<i className={`fa-solid ${item.iconKey} text-lg ${item.color}`}></i>
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<p className="font-semibold text-sm">{item.name}</p>
												{isActive && (
													<span className="badge badge-xs badge-success gap-1">
														<i className="fa-solid fa-check text-[8px]"></i>
														equipped
													</span>
												)}
											</div>
											<p className="text-xs text-base-content/50 mt-0.5">
												{item.description}
											</p>
										</div>

										{owned ? (
											<span className="badge badge-success gap-1 text-xs">
												<i className="fa-solid fa-check"></i> Owned
											</span>
										) : (
											<PurchaseButton
												itemKey={item.key}
												cost={item.cost}
												currentGems={gems}
												alreadyOwned={false}
												label={ownedLabel(item.key)}
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{/* Boosts shop section */}
				<section className="flex flex-col gap-3">
					<p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
						Boosts
					</p>
					<div className="flex flex-col gap-3">
						{boosts.map((item) => {
							const owned = isOwned(item.key, item.frameKey);
							return (
								<div
									key={item.key}
									className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="card-body py-4 flex-row items-center gap-4">
										<div
											className={`flex items-center justify-center w-12 h-12 rounded-xl bg-base-300 text-2xl shrink-0 ${item.color}`}
										>
											<i className={`fa-solid ${item.iconKey}`}></i>
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm">{item.name}</p>
											<p className="text-xs text-base-content/50 mt-0.5">
												{item.description}
											</p>
										</div>
										<PurchaseButton
											itemKey={item.key}
											cost={item.cost}
											currentGems={gems}
											alreadyOwned={owned}
											label={ownedLabel(item.key)}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{/* How to earn gems */}
				<section className="card bg-base-200/60 border border-base-300 shadow-sm">
					<div className="card-body py-4 gap-3">
						<p className="text-xs font-bold uppercase tracking-widest text-base-content/40">
							How to earn gems
						</p>
						<ul className="flex flex-col gap-2 text-sm text-base-content/70">
							<li className="flex items-center gap-2">
								<i className="fa-solid fa-calendar-check text-primary w-4 text-center"></i>
								Complete a class — <strong className="text-base-content">+100 gems</strong>
							</li>
							<li className="flex items-center gap-2">
								<i className="fa-solid fa-credit-card text-primary w-4 text-center"></i>
								Pay for a class — <strong className="text-base-content">+50 gems</strong>
							</li>
							<li className="flex items-center gap-2">
								<i className="fa-solid fa-star text-primary w-4 text-center"></i>
								Leave a review — <strong className="text-base-content">+50 gems</strong>
							</li>
						</ul>
					</div>
				</section>

			</div>
		</div>
	);
}

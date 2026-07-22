"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { saveAvatarOptions } from "@/app/lib/actions/avatar.actions";
import {
	buildAvatarDataUri,
	parseAvatarOptions,
	DEFAULT_OPTIONS,
	VALID_SKIN_COLORS,
	VALID_HAIR_STYLES,
	VALID_REAR_HAIR,
	VALID_EYES,
	VALID_EYEBROWS,
	VALID_MOUTHS,
	VALID_CLOTHES,
	VALID_BEARDS,
	type AvatarOptions,
} from "@/app/lib/avatar-utils";

/* ── Colour palettes ──────────────────────────────────────────────────────── */

// Skin: only the 5 toon-head skin tones (by design)
const SKIN_SWATCHES = [...VALID_SKIN_COLORS];

// Hair: expanded — local generation accepts any 6-digit hex
const HAIR_COLOR_GROUPS: { label: string; colors: string[] }[] = [
	{ label: "Dark",   colors: ["0a0a0a", "1a0800", "2c1b18"] },
	{ label: "Brown",  colors: ["4a2511", "724133", "8b4513", "a55728", "b07842"] },
	{ label: "Blonde", colors: ["b58143", "c8a96e", "d6b370", "deb887", "f5e6c8"] },
	{ label: "Grey",   colors: ["808080", "b0b0b0", "e0e0e0"] },
	{ label: "Vivid",  colors: ["b71c1c", "e91e63", "9c27b0", "1565c0", "00838f", "2e7d32", "f97316"] },
];

// Clothes: expanded — local generation accepts any 6-digit hex
const CLOTHES_COLOR_GROUPS: { label: string; colors: string[] }[] = [
	{ label: "Neutral", colors: ["151613", "2d2d2d", "545454", "808080", "c8c8c8", "e8e9e6"] },
	{ label: "Warm",    colors: ["b11f1f", "e91e63", "ec4899", "f97316", "fb8c00", "eab308"] },
	{ label: "Cool",    colors: ["0b3286", "1565c0", "42a5f5", "00838f", "147f3c", "2e7d32", "731ac3"] },
];

// Background: free hex (DiceBear accepts any hex for backgroundColor)
const BG_SWATCHES: { hex: string; label: string }[] = [
	{ hex: "transparent", label: "None"       },
	{ hex: "b6e3f4",      label: "Sky"        },
	{ hex: "c0aede",      label: "Lavender"   },
	{ hex: "d1d4f9",      label: "Periwinkle" },
	{ hex: "ffd5dc",      label: "Rose"       },
	{ hex: "ffdfbf",      label: "Peach"      },
	{ hex: "d1fae5",      label: "Mint"       },
	{ hex: "fef3c7",      label: "Cream"      },
	{ hex: "f0f0f0",      label: "Smoke"      },
	{ hex: "e0e0e0",      label: "Silver"     },
	{ hex: "ffffff",      label: "White"      },
	{ hex: "1a1a2e",      label: "Night"      },
	{ hex: "0d1b2a",      label: "Deep Blue"  },
	{ hex: "1b2838",      label: "Dark"       },
];

/* ── Option labels ────────────────────────────────────────────────────────── */

const HAIR_LABELS: Record<string, string> = {
	bun: "Bun", sideComed: "Side Comb", spiky: "Spiky", undercut: "Undercut",
};
const REAR_HAIR_LABELS: Record<string, string> = {
	neckHigh: "Neck", shoulderHigh: "Shoulder", longStraight: "Straight", longWavy: "Wavy",
};
const CLOTHES_LABELS: Record<string, string> = {
	dress: "Dress", openJacket: "Jacket", shirt: "Shirt", tShirt: "T-Shirt", turtleNeck: "Turtleneck",
};
const FACE_LABELS: Record<string, string> = {
	bow: "Bow", happy: "Happy", humble: "Humble", wide: "Wide", wink: "Wink",
	angry: "Angry", neutral: "Neutral", raised: "Raised", sad: "Sad",
	agape: "Agape", laugh: "Laugh", smile: "Smile",
	chin: "Chin", chinMoustache: "Chin + Moustache", fullBeard: "Full", longBeard: "Long", moustacheTwirl: "Twirl",
};

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

type TabId = "hair" | "face" | "outfit" | "background";

const TABS: { id: TabId; label: string; icon: string }[] = [
	{ id: "hair",       label: "Hair",       icon: "fa-scissors"   },
	{ id: "face",       label: "Face",       icon: "fa-face-smile" },
	{ id: "outfit",     label: "Outfit",     icon: "fa-shirt"      },
	{ id: "background", label: "Background", icon: "fa-image"      },
];

/* ── Component ────────────────────────────────────────────────────────────── */

interface Props {
	email: string;
	avatarOptionsJson: string | null;
}

export default function AvatarCustomizer({ email, avatarOptionsJson }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tab, setTab] = useState<TabId>("hair");
	const [opts, setOpts] = useState<AvatarOptions>(
		() => parseAvatarOptions(avatarOptionsJson) ?? DEFAULT_OPTIONS,
	);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const dialogRef = useRef<HTMLDialogElement>(null);

	// Generated locally — instant, no network
	const previewDataUri = buildAvatarDataUri(email, opts);

	useEffect(() => { setMounted(true); }, []);

	// Real showModal()/close() instead of a CSS-only "modal-open" class: free
	// focus trap + Escape-to-close (see class-action-modals.tsx for the same
	// pattern). onClose keeps isOpen in sync when dismissed via Escape.
	useEffect(() => {
		if (!mounted) return;
		if (isOpen) dialogRef.current?.showModal();
		else dialogRef.current?.close();
	}, [isOpen, mounted]);

	function set<K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) {
		setOpts((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	}

	function goeBald() {
		setOpts((prev) => ({ ...prev, showHair: false, showRearHair: false }));
		setSaved(false);
	}

	function openModal() {
		setOpts(parseAvatarOptions(avatarOptionsJson) ?? DEFAULT_OPTIONS);
		setSaved(false);
		setError(null);
		setTab("hair");
		setIsOpen(true);
	}

	function handleSave() {
		setSaved(false);
		setError(null);
		startTransition(async () => {
			const result = await saveAvatarOptions(JSON.stringify(opts));
			if (result?.error) {
				setError(result.error);
			} else {
				setSaved(true);
				setTimeout(() => setIsOpen(false), 800);
			}
		});
	}

	return (
		<>
			{/* Edit pencil button */}
			<button
				onClick={openModal}
				aria-label="Edit avatar"
				className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-primary-content shadow-md flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-10"
			>
				<i className="fa-solid fa-pen text-[9px]" />
			</button>

			{/* Modal — portalled to <body> to escape overflow:hidden ancestors.
			    Always rendered once mounted; visibility is driven entirely by
			    showModal()/close() via dialogRef (see the useEffect above). */}
			{mounted && createPortal(
				<dialog ref={dialogRef} className="modal" style={{ zIndex: 9999 }} onClose={() => setIsOpen(false)}>
					<div className="modal-box w-full max-w-3xl p-0 overflow-hidden flex flex-col max-h-[92vh]">

						{/* Header */}
						<div className="flex items-center justify-between px-5 py-4 border-b border-base-300 shrink-0">
							<h3 className="font-bold text-lg">Customize Avatar</h3>
							<button className="btn btn-sm btn-ghost btn-circle" onClick={() => setIsOpen(false)} aria-label="Close">
								<i className="fa-solid fa-xmark" />
							</button>
						</div>

						{/* Body */}
						<div className="flex flex-1 overflow-hidden min-h-0">

							{/* ── Left: preview + vertical tab nav ──────────────── */}
							<div className="w-44 shrink-0 flex flex-col items-center gap-4 px-4 py-6 bg-base-200/60 border-r border-base-300 overflow-y-auto">

								{/* Avatar preview — local SVG, updates instantly */}
								<div className="w-28 h-28 shrink-0">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={previewDataUri}
										alt="Avatar preview"
										width={112}
										height={112}
										className="w-28 h-28 object-cover rounded-lg"
									/>
								</div>

								{/* Vertical tab list */}
								<nav className="flex flex-col w-full gap-0.5">
									{TABS.map((t) => (
										<button
											key={t.id}
											onClick={() => setTab(t.id)}
											className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
												tab === t.id
													? "bg-primary text-primary-content"
													: "hover:bg-base-300 text-base-content/70"
											}`}
										>
											<i className={`fa-solid ${t.icon} w-3.5 text-center text-xs shrink-0`} />
											{t.label}
										</button>
									))}
								</nav>

								{/* Reset */}
								<button
									type="button"
									className="btn btn-xs btn-ghost text-base-content/40 gap-1 mt-auto"
									onClick={() => { setOpts(DEFAULT_OPTIONS); setSaved(false); }}
								>
									<i className="fa-solid fa-rotate-left text-[10px]" />
									Reset
								</button>
							</div>

							{/* ── Right: tab content ────────────────────────────── */}
							<div className="flex-1 overflow-y-auto px-5 py-5">

								{/* ── HAIR ── */}
								{tab === "hair" && (
									<div className="flex flex-col gap-5">

										<OptionSection label="Style">
											<div className="grid grid-cols-2 gap-2">
												<Chip active={!opts.showHair} onClick={goeBald}>
													<i className="fa-solid fa-user text-sm" />
													Bald
												</Chip>
												{VALID_HAIR_STYLES.map((h) => (
													<Chip
														key={h}
														active={opts.showHair && opts.hair === h}
														onClick={() => setOpts((p) => ({ ...p, showHair: true, hair: h }))}
													>
														{HAIR_LABELS[h]}
													</Chip>
												))}
											</div>
										</OptionSection>

										{opts.showHair && (
											<>
												<OptionSection label="Colour">
													<SwatchGroups
														groups={HAIR_COLOR_GROUPS}
														selected={opts.hairColor}
														onChange={(c) => set("hairColor", c)}
													/>
												</OptionSection>

												<OptionSection
													label="Back Hair"
													right={<Toggle on={opts.showRearHair} onChange={(v) => set("showRearHair", v)} />}
												>
													{opts.showRearHair && (
														<div className="grid grid-cols-2 gap-2">
															{VALID_REAR_HAIR.map((r) => (
																<Chip
																	key={r}
																	active={opts.rearHair === r}
																	onClick={() => set("rearHair", r)}
																>
																	{REAR_HAIR_LABELS[r]}
																</Chip>
															))}
														</div>
													)}
												</OptionSection>
											</>
										)}
									</div>
								)}

								{/* ── FACE ── */}
								{tab === "face" && (
									<div className="flex flex-col gap-5">

										<OptionSection label="Skin Tone">
											<div className="flex gap-3">
												{SKIN_SWATCHES.map((c) => (
													<button
														key={c}
														onClick={() => set("skinColor", c)}
														title={`#${c}`}
														aria-label={`Skin tone #${c}`}
														aria-pressed={opts.skinColor === c}
														className={`w-9 h-9 rounded-full border-2 transition-all ${
															opts.skinColor === c
																? "ring-2 ring-offset-2 ring-base-content scale-110 border-transparent"
																: "border-base-300 hover:scale-105"
														}`}
														style={{ backgroundColor: `#${c}` }}
													/>
												))}
											</div>
										</OptionSection>

										<OptionSection label="Eyes">
											<div className="grid grid-cols-3 gap-2">
												{VALID_EYES.map((v) => (
													<Chip key={v} active={opts.eyes === v} onClick={() => set("eyes", v)}>
														{FACE_LABELS[v]}
													</Chip>
												))}
											</div>
										</OptionSection>

										<OptionSection label="Eyebrows">
											<div className="grid grid-cols-3 gap-2">
												{VALID_EYEBROWS.map((v) => (
													<Chip key={v} active={opts.eyebrows === v} onClick={() => set("eyebrows", v)}>
														{FACE_LABELS[v]}
													</Chip>
												))}
											</div>
										</OptionSection>

										<OptionSection label="Mouth">
											<div className="grid grid-cols-3 gap-2">
												{VALID_MOUTHS.map((v) => (
													<Chip key={v} active={opts.mouth === v} onClick={() => set("mouth", v)}>
														{FACE_LABELS[v]}
													</Chip>
												))}
											</div>
										</OptionSection>

										<OptionSection
											label="Beard"
											right={<Toggle on={opts.showBeard} onChange={(v) => set("showBeard", v)} />}
										>
											{opts.showBeard && (
												<div className="grid grid-cols-2 gap-2">
													{VALID_BEARDS.map((v) => (
														<Chip key={v} active={opts.beard === v} onClick={() => set("beard", v)}>
															{FACE_LABELS[v]}
														</Chip>
													))}
												</div>
											)}
										</OptionSection>
									</div>
								)}

								{/* ── OUTFIT ── */}
								{tab === "outfit" && (
									<div className="flex flex-col gap-5">

										<OptionSection label="Style">
											<div className="grid grid-cols-2 gap-2">
												{VALID_CLOTHES.map((v) => (
													<Chip key={v} active={opts.clothes === v} onClick={() => set("clothes", v)}>
														{CLOTHES_LABELS[v]}
													</Chip>
												))}
											</div>
										</OptionSection>

										<OptionSection label="Colour">
											<SwatchGroups
												groups={CLOTHES_COLOR_GROUPS}
												selected={opts.clothesColor}
												onChange={(c) => set("clothesColor", c)}
											/>
										</OptionSection>
									</div>
								)}

								{/* ── BACKGROUND ── */}
								{tab === "background" && (
									<OptionSection label="Colour">
										<div className="flex flex-wrap gap-2">
											{BG_SWATCHES.map(({ hex, label }) => (
												<button
													key={hex}
													title={label}
													aria-label={label}
													aria-pressed={opts.backgroundColor === hex}
													onClick={() => set("backgroundColor", hex)}
													className={`w-9 h-9 rounded-full border-2 transition-all ${
														opts.backgroundColor === hex
															? "ring-2 ring-offset-2 ring-base-content scale-110 border-transparent"
															: "border-base-300 hover:scale-105"
													}`}
													style={
														hex === "transparent"
															? { backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 8px 8px" }
															: { backgroundColor: `#${hex}` }
													}
												/>
											))}
										</div>
									</OptionSection>
								)}

							</div>
						</div>

						{/* Footer */}
						<div className="shrink-0 flex items-center gap-3 px-5 py-4 border-t border-base-300 bg-base-200/30">
							<button className="btn btn-ghost btn-sm" onClick={() => setIsOpen(false)}>
								Cancel
							</button>
							{error && <span className="text-error text-xs flex-1">{error}</span>}
							<button
								className={`btn btn-sm ml-auto gap-2 ${saved ? "btn-success" : "btn-primary"}`}
								onClick={handleSave}
								disabled={isPending || saved}
							>
								{isPending ? (
									<span className="loading loading-spinner loading-xs" />
								) : saved ? (
									<><i className="fa-solid fa-check" /> Saved!</>
								) : (
									<><i className="fa-solid fa-floppy-disk" /> Save Avatar</>
								)}
							</button>
						</div>

					</div>
					<div className="modal-backdrop" onClick={() => setIsOpen(false)} />
				</dialog>,
				document.body,
			)}
		</>
	);
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function OptionSection({
	label, right, children,
}: {
	label: string;
	right?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<p className="text-[11px] font-bold uppercase tracking-widest text-base-content/40">{label}</p>
				{right}
			</div>
			{children}
		</div>
	);
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
	return (
		<label className="flex items-center gap-1.5 cursor-pointer">
			<input
				type="checkbox"
				className="toggle toggle-xs toggle-primary"
				checked={on}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span className="text-[11px] text-base-content/50 w-5">{on ? "On" : "Off"}</span>
		</label>
	);
}

function Chip({ active, onClick, children }: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
				active
					? "bg-primary text-primary-content"
					: "bg-base-300 text-base-content hover:bg-base-300/70"
			}`}
		>
			{children}
		</button>
	);
}

function SwatchGroups({ groups, selected, onChange }: {
	groups: { label: string; colors: string[] }[];
	selected: string;
	onChange: (c: string) => void;
}) {
	return (
		<div className="flex flex-col gap-3">
			{groups.map((g) => (
				<div key={g.label} className="flex flex-col gap-1.5">
					<p className="text-[10px] font-semibold text-base-content/35 uppercase tracking-wider">{g.label}</p>
					<div className="flex flex-wrap gap-2">
						{g.colors.map((c) => (
							<button
								key={c}
								onClick={() => onChange(c)}
								title={`#${c}`}
								aria-label={`${g.label} #${c}`}
								aria-pressed={selected === c}
								className={`w-7 h-7 rounded-full border-2 transition-all ${
									selected === c
										? "ring-2 ring-offset-1 ring-base-content scale-125 border-transparent"
										: "border-base-200 hover:scale-110"
								}`}
								style={{ backgroundColor: `#${c}` }}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

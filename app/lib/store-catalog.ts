export type StoreItemKey =
	| "frame_scholar"
	| "frame_luminary"
	| "frame_sage"
	| "study_boost"
	| "priority_booking"
	| "streak_freeze";

export interface StoreItem {
	key: StoreItemKey;
	name: string;
	description: string;
	cost: number;
	iconKey: string;
	color: string;
	category: "cosmetic" | "boost";
	frameKey?: string;
	consumable?: boolean;
}

export const STORE_ITEMS: StoreItem[] = [
	{
		key: "frame_scholar",
		name: "Scholar Frame",
		description: "A distinguished golden border for your profile.",
		cost: 300,
		iconKey: "fa-medal",
		color: "text-warning",
		category: "cosmetic",
		frameKey: "scholar",
	},
	{
		key: "frame_luminary",
		name: "Luminary Frame",
		description: "A radiant purple aura for high achievers.",
		cost: 800,
		iconKey: "fa-crown",
		color: "text-accent",
		category: "cosmetic",
		frameKey: "luminary",
	},
	{
		key: "frame_sage",
		name: "Sage Frame",
		description: "The rarest frame — a deep teal glow for Sages.",
		cost: 2000,
		iconKey: "fa-gem",
		color: "text-success",
		category: "cosmetic",
		frameKey: "sage",
	},
	{
		key: "study_boost",
		name: "Study Boost",
		description: "Get 5% off your next class booking.",
		cost: 200,
		iconKey: "fa-bolt",
		color: "text-warning",
		category: "boost",
		consumable: true,
	},
	{
		key: "priority_booking",
		name: "Priority Match",
		description: "Your next on-demand request is shown first to available teachers.",
		cost: 250,
		iconKey: "fa-arrow-up-right-dots",
		color: "text-info",
		category: "boost",
		consumable: true,
	},
	{
		key: "streak_freeze",
		name: "Streak Freeze",
		description: "Covers one missed week without breaking your activity streak. Stacks — buy more than one.",
		cost: 150,
		iconKey: "fa-snowflake",
		color: "text-info",
		category: "boost",
	},
];

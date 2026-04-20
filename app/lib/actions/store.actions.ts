"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { STORE_ITEMS } from "@/app/lib/store-catalog";
import type { StoreItemKey } from "@/app/lib/store-catalog";

export type { StoreItemKey };

export async function fetchStudentStoreState(): Promise<{
	gems: number;
	ownedFrames: string[];
	activeFrame: string | null;
	studyBoostActive: boolean;
	priorityBooking: boolean;
	avatarOptions: string | null;
}> {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			avatarOptions: true,
			studentGameProfile: {
				select: {
					insightGems: true,
					ownedFrames: true,
					activeFrame: true,
					studyBoostActive: true,
					priorityBooking: true,
				},
			},
		},
	});

	const profile = user?.studentGameProfile;
	return {
		gems: profile?.insightGems ?? 0,
		ownedFrames: profile?.ownedFrames
			? profile.ownedFrames.split(",").filter(Boolean)
			: [],
		activeFrame: profile?.activeFrame ?? null,
		studyBoostActive: profile?.studyBoostActive ?? false,
		priorityBooking: profile?.priorityBooking ?? false,
		avatarOptions: user?.avatarOptions ?? null,
	};
}

export async function setActiveFrame(
	frameKey: string | null,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			studentGameProfile: { select: { id: true, ownedFrames: true } },
		},
	});

	if (!user?.studentGameProfile) return { error: "Profile not found." };

	// Verify the frame is owned (or null to unequip)
	if (frameKey !== null) {
		const owned = user.studentGameProfile.ownedFrames
			?.split(",")
			.filter(Boolean) ?? [];
		if (!owned.includes(frameKey)) return { error: "Frame not owned." };
	}

	await prisma.studentGameProfile.update({
		where: { userId: user.id },
		data: { activeFrame: frameKey },
	});

	revalidatePath("/main/student/store");
	revalidatePath("/main/student/profile");
	revalidatePath("/main/student/dashboard");
	return {};
}

export async function purchaseStoreItem(
	itemKey: StoreItemKey,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	const item = STORE_ITEMS.find((i) => i.key === itemKey);
	if (!item) return { error: "Item not found." };

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			studentGameProfile: {
				select: {
					id: true,
					insightGems: true,
					ownedFrames: true,
					studyBoostActive: true,
					priorityBooking: true,
				},
			},
		},
	});

	if (!user) return { error: "User not found." };

	const profile = user.studentGameProfile;
	const currentGems = profile?.insightGems ?? 0;

	if (currentGems < item.cost) {
		return { error: `Not enough gems. You need ${item.cost} but have ${currentGems}.` };
	}

	// Check if already owned / active
	if (item.category === "cosmetic" && item.frameKey) {
		const owned = profile?.ownedFrames
			? profile.ownedFrames.split(",").filter(Boolean)
			: [];
		if (owned.includes(item.frameKey)) {
			return { error: "You already own this frame." };
		}
	}
	if (itemKey === "study_boost" && profile?.studyBoostActive) {
		return { error: "You already have an active Study Boost." };
	}
	if (itemKey === "priority_booking" && profile?.priorityBooking) {
		return { error: "You already have Priority Match active." };
	}

	// Build update payload
	const updateData: Record<string, unknown> = {
		insightGems: { decrement: item.cost },
	};

	if (item.category === "cosmetic" && item.frameKey) {
		const existing = profile?.ownedFrames ?? "";
		const newFrames = existing ? `${existing},${item.frameKey}` : item.frameKey;
		updateData.ownedFrames = newFrames;
	} else if (itemKey === "study_boost") {
		updateData.studyBoostActive = true;
	} else if (itemKey === "priority_booking") {
		updateData.priorityBooking = true;
	}

	// profile is guaranteed to exist (currentGems >= item.cost > 0 above)
	await prisma.studentGameProfile.update({
		where: { userId: user.id },
		data: updateData,
	});

	revalidatePath("/main/student/store");
	revalidatePath("/main/student/dashboard");
	return {};
}

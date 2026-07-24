"use server";

import prisma from "@/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { awardSparks } from "@/app/lib/gamification";

export async function fetchUsers() {
	try {
		const users = await prisma.user.findMany();
		return users;
	} catch (error) {
		console.log(error);
	}
}

export async function fetchUserById(id: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { id: id },
		});

		return user;
	} catch (error) {
		console.log(error);
	}
}

export async function fetchUserByEmail(email: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { email: email },
			include: {
				classesAsStudent: true,
				classesAsTeacher: true,
				studentGameProfile: true,
				teacherGameProfile: true,
			},
		});

		return user;
	} catch (error) {
		console.log(error);
	}
}

// ── Badge fetch ───────────────────────────────────────────────────────────────

export async function fetchAllBadges() {
	return prisma.badge.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export async function fetchEarnedBadges(userId: string) {
	return prisma.userBadge.findMany({
		where: { userId },
		include: { badge: true },
		orderBy: { earnedAt: "asc" },
	});
}

// ── Profile update ────────────────────────────────────────────────────────────

export interface UpdateProfileData {
	firstName: string;
	lastName: string;
	bio?: string;
	// student fields
	learningStyle?: string;
	learningGoal?: string;
	// teacher fields
	teachingStyle?: string;
	pricePerHour?: number;
}

export async function updateProfile(
	data: UpdateProfileData,
): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	try {
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: { teacherGameProfile: true },
		});
		if (!user) return { error: "User not found." };

		await prisma.user.update({
			where: { id: user.id },
			data: {
				// Only overwrite name fields when they're non-empty
				...(data.firstName.trim() && { firstName: data.firstName.trim() }),
				...(data.lastName.trim() && { lastName: data.lastName.trim() }),
				...("bio" in data && { bio: data.bio?.trim() || null }),
				...("learningStyle" in data && {
					learningStyle: data.learningStyle?.trim() || null,
				}),
				...("learningGoal" in data && {
					learningGoal: data.learningGoal?.trim() || null,
				}),
				...("teachingStyle" in data && {
					teachingStyle: data.teachingStyle?.trim() || null,
				}),
				...(data.pricePerHour !== undefined && {
					pricePerHour: data.pricePerHour,
				}),
			},
		});

		// One-time spark reward when a teacher completes their profile for the
		// first time. Best-effort: the profile fields above are already saved,
		// so a hiccup here (e.g. a gamification race) must not turn into a
		// hard failure that blocks the caller from redirecting onward.
		if (user.role === "teacher") {
			const alreadyCompleted = user.teacherGameProfile?.profileCompleted ?? false;
			if (!alreadyCompleted) {
				try {
					await prisma.teacherGameProfile.upsert({
						where: { userId: user.id },
						create: { userId: user.id, profileCompleted: true },
						update: { profileCompleted: true },
					});
					await awardSparks(user.id, 150);
				} catch (error) {
					console.error("[updateProfile] profile-completion reward failed", error);
				}
			}
		}

		revalidatePath(
			user.role === "teacher"
				? "/main/teacher/profile"
				: "/main/student/profile",
		);
		return {};
	} catch (error) {
		console.error("[updateProfile]", error);
		return { error: "Something went wrong. Please try again." };
	}
}

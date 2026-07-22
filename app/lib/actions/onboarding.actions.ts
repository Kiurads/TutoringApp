"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";

// Marks the one-time welcome tour as seen — called when the user finishes
// or explicitly skips it (see app/ui/onboarding/welcome-tour-modal.tsx).
// Deliberately independent of whether they actually set any preferences:
// those stay freely revisitable afterward, this only stops the tour modal
// itself from appearing again.
export async function completeOnboardingTour(): Promise<{ error?: string }> {
	const session = await auth();
	if (!session?.user?.email) return { error: "Not authenticated." };

	await prisma.user.update({
		where: { email: session.user.email },
		data: { hasCompletedOnboarding: true },
	});

	return {};
}

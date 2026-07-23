"use server";

import { auth } from "@/auth";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";

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

	// Without this, the dashboard's client-side Router Cache can keep serving
	// the RSC payload rendered before this flip, making the tour reappear on
	// the very next visit even though the DB is already updated.
	revalidatePath("/main/student/dashboard");
	revalidatePath("/main/teacher/dashboard");

	return {};
}

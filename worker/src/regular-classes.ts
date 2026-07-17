import prisma from "@/prisma";
import { materializeOccurrences } from "@/app/lib/regular-classes/materialize-occurrences";

/**
 * Runs the rolling-window occurrence generator for every active recurring
 * series. Failures for one series are isolated so they don't stop the rest
 * from being processed.
 */
export async function materializeAllActiveSeries(): Promise<void> {
	const activeSeries = await prisma.regularClass.findMany({
		where: { status: "active" },
		select: { id: true },
	});

	for (const rc of activeSeries) {
		try {
			const created = await materializeOccurrences(rc.id);
			if (created > 0) {
				console.log(
					`[worker] Materialized ${created} occurrence(s) for regular class ${rc.id}.`,
				);
			}
		} catch (err) {
			console.error(
				`[worker] Error materializing occurrences for regular class ${rc.id}:`,
				err,
			);
		}
	}
}

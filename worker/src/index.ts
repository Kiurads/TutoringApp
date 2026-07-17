import "dotenv/config";
import { markCompletedClasses } from "./complete-classes";
import { materializeAllActiveSeries } from "./regular-classes";

const COMPLETION_POLL_INTERVAL_MS = 5 * 60 * 1000;
const REGULAR_CLASS_POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function runCompletionCheck() {
	try {
		await markCompletedClasses();
	} catch (err) {
		console.error("[worker] Error while marking completed classes:", err);
	}
}

async function runRegularClassMaterialization() {
	try {
		await materializeAllActiveSeries();
	} catch (err) {
		console.error("[worker] Error while materializing recurring class occurrences:", err);
	}
}

runCompletionCheck();
setInterval(runCompletionCheck, COMPLETION_POLL_INTERVAL_MS);

runRegularClassMaterialization();
setInterval(runRegularClassMaterialization, REGULAR_CLASS_POLL_INTERVAL_MS);

console.log(
	`[worker] Started. Checking for completed classes every ${COMPLETION_POLL_INTERVAL_MS / 60_000} minutes, ` +
	`materializing recurring class occurrences every ${REGULAR_CLASS_POLL_INTERVAL_MS / 3_600_000} hours.`,
);

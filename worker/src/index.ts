import "dotenv/config";
import { createServer } from "node:http";
import { markCompletedClasses } from "./complete-classes";
import { materializeAllActiveSeries } from "./regular-classes";
import { sweepExpiredRefundRequests } from "./expire-refund-requests";

const COMPLETION_POLL_INTERVAL_MS = 5 * 60 * 1000;
const REGULAR_CLASS_POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;
const REFUND_EXPIRY_POLL_INTERVAL_MS = 60 * 60 * 1000;
const HEALTH_CHECK_PORT = Number(process.env.PORT) || 8081;

// Tracks the last time each poll loop *finished* (success or failure) so the
// health endpoint can detect a hung/dead loop, not just "the process exists."
let lastCompletionCheckAt: number | null = null;
let lastRegularClassCheckAt: number | null = null;
let lastRefundExpiryCheckAt: number | null = null;

async function runCompletionCheck() {
	try {
		await markCompletedClasses();
	} catch (err) {
		console.error("[worker] Error while marking completed classes:", err);
	} finally {
		lastCompletionCheckAt = Date.now();
	}
}

async function runRegularClassMaterialization() {
	try {
		await materializeAllActiveSeries();
	} catch (err) {
		console.error("[worker] Error while materializing recurring class occurrences:", err);
	} finally {
		lastRegularClassCheckAt = Date.now();
	}
}

async function runRefundExpirySweep() {
	try {
		await sweepExpiredRefundRequests();
	} catch (err) {
		console.error("[worker] Error while sweeping expired refund requests:", err);
	} finally {
		lastRefundExpiryCheckAt = Date.now();
	}
}

runCompletionCheck();
setInterval(runCompletionCheck, COMPLETION_POLL_INTERVAL_MS);

runRegularClassMaterialization();
setInterval(runRegularClassMaterialization, REGULAR_CLASS_POLL_INTERVAL_MS);

runRefundExpirySweep();
setInterval(runRefundExpirySweep, REFUND_EXPIRY_POLL_INTERVAL_MS);

// Minimal HTTP health endpoint so a hosting platform can detect a stalled
// polling loop instead of only knowing the process is still running.
// Allows double the interval as slack for a single slow run before failing.
createServer((req, res) => {
	if (req.url !== "/health") {
		res.writeHead(404).end();
		return;
	}

	const now = Date.now();
	const completionStale =
		lastCompletionCheckAt !== null &&
		now - lastCompletionCheckAt > COMPLETION_POLL_INTERVAL_MS * 2;
	const regularClassStale =
		lastRegularClassCheckAt !== null &&
		now - lastRegularClassCheckAt > REGULAR_CLASS_POLL_INTERVAL_MS * 2;
	const refundExpiryStale =
		lastRefundExpiryCheckAt !== null &&
		now - lastRefundExpiryCheckAt > REFUND_EXPIRY_POLL_INTERVAL_MS * 2;

	const anyStale = completionStale || regularClassStale || refundExpiryStale;

	const body = JSON.stringify({
		status: anyStale ? "error" : "ok",
		lastCompletionCheckAt,
		lastRegularClassCheckAt,
		lastRefundExpiryCheckAt,
	});

	res.writeHead(anyStale ? 503 : 200, {
		"Content-Type": "application/json",
	});
	res.end(body);
}).listen(HEALTH_CHECK_PORT);

console.log(
	`[worker] Started. Checking for completed classes every ${COMPLETION_POLL_INTERVAL_MS / 60_000} minutes, ` +
	`materializing recurring class occurrences every ${REGULAR_CLASS_POLL_INTERVAL_MS / 3_600_000} hours, ` +
	`sweeping expired refund requests every ${REFUND_EXPIRY_POLL_INTERVAL_MS / 3_600_000} hour(s). ` +
	`Health endpoint on port ${HEALTH_CHECK_PORT}.`,
);

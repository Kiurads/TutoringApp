// The base class price formula, reimplemented independently at several call
// sites before this — a real drift risk, since only some of them applied
// the Study Boost discount. `studyBoostActive` defaults to false so a caller
// that has no notion of it (e.g. a broadcast/on-demand booking, a recurring
// series) gets exactly the undiscounted price it always computed.
export function computeClassPrice(
	pricePerHour: number,
	durationInHours: number,
	studyBoostActive: boolean = false,
): number {
	const basePrice = pricePerHour * durationInHours;
	return studyBoostActive ? Math.round(basePrice * 0.95 * 100) / 100 : basePrice;
}

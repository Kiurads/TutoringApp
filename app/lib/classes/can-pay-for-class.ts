// A class becomes payable once it's scheduled or completed and hasn't been
// paid yet. `hasPreAuth` is an optional extra guard — an outstanding pre-auth
// hold is captured automatically on accept, so surfacing a manual "Pay Now"
// action while one is still outstanding risks a race against that automatic
// capture. Only app/main/student/classes/[id]/page.tsx currently has
// `hasPreAuth` data available to pass; the table-view call sites work off
// summarized list data that doesn't carry it, so omitting it there preserves
// their existing behavior exactly.
export function canPayForClass(cls: {
	paid: boolean;
	status: string;
	hasPreAuth?: boolean;
}): boolean {
	if (cls.hasPreAuth) return false;
	return !cls.paid && (cls.status === "scheduled" || cls.status === "completed");
}

# app/lib/availability

A single pure function, `isWithinAvailability`, that answers "is this teacher free at this time?" against their configured weekly schedule. It's the one enforcement point for availability that must stay consistent across every booking path in the app.

## Key file

- **`check-availability.ts`** — exports `isWithinAvailability(slots, startTime, durationInHours)`. Deliberately has *no imports* ("Pure availability checker — no imports, safe to use on client and server," per its header comment), so it can run in a form's client-side pre-filter as well as server-side re-validation without pulling in Prisma or auth.
  - A class is "within availability" only if **every 30-minute block it occupies** has a matching slot. It builds a `Set` of `"dayOfWeek-startHour-startMin"` keys from the teacher's saved slots, then walks the requested window in 30-minute increments checking each block is in that set. This means availability slots are assumed to be stored as discrete 30-minute blocks (not open time ranges) — a slot list with gaps mid-range will reject a class that spans the gap.
  - **`slots.length === 0` → always returns `true`.** A teacher who hasn't configured any `TeacherAvailability` rows is treated as always-available. This is called out explicitly as deliberate ("they haven't configured their schedule yet"), not a bug — if a user reports "availability isn't being enforced" for a specific teacher, check whether that teacher simply has zero rows before assuming something is broken.
  - `dayOfWeek` follows JS `Date.getDay()` convention: `0 = Sunday … 6 = Saturday`.

## How it fits together

Called from exactly three places, all of which must stay in sync with each other since this is the actual enforcement layer (not just a UI filter):
1. `app/lib/classes/create-class-as-student.ts` (specific-teacher booking)
2. `app/lib/classes/create-class-with-pre-auth.ts` (pre-authorized booking, where the comment notes this call is "defence in depth" — the primary check already happened client-side and in the API route below)
3. `app/api/payment-intent/pre-auth/route.ts` (server-side re-validation before creating the Stripe pre-auth PaymentIntent) — **this is the actual enforcement point**, not the client-side filter that runs first to shape the UI. Never remove this server-side re-check even though it looks redundant with the client filtering.

The slot data itself (`TeacherAvailability` rows) is managed by `app/lib/actions/availability.actions.ts`'s `setAvailability`, which does a full delete-then-recreate of a teacher's slots inside one transaction (see the `app/lib/actions` README) — `isWithinAvailability` just reads whatever rows currently exist, it has no awareness of how they got there.

## Gotchas

- Don't confuse "no slots" (always available) with "explicitly unavailable" — there's no way in this function to represent a teacher who has configured availability but is unavailable for a given range outside it versus one who simply never set anything up. Both look like "no restriction" only in the zero-rows case; any non-empty slot list is a strict allow-list.
- This function has no knowledge of existing booked classes — that's a separate concern handled by `teacherHasSchedulingConflict` in `app/lib/classes/check-teacher-conflict.ts`. A time can pass `isWithinAvailability` and still be rejected for conflicting with an already-scheduled class.

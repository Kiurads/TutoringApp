# app/ui/main/store

Thin client-side interactive wrappers for the gem store page (`app/main/student/store/page.tsx`). Both components are deliberately "dumb" — they hold only UI/transition state (pending, error) and delegate all validation, gem accounting, and persistence to server actions in `app/lib/actions/store.actions.ts`. Do not add business logic (ownership checks, affordability checks, etc.) here; add it to the action.

## Files

- **`purchase-button.tsx`** — Buys a store item. Calls `purchaseStoreItem(itemKey)` from `store.actions.ts` inside a `useTransition`. `canAfford` is computed client-side (`currentGems >= cost`) purely to disable the button and show a "Need N more" hint — this is a UX nicety, not the source of truth; the real affordability guard lives server-side in `purchaseStoreItem`. On success it does **not** just `router.refresh()` — it navigates to `/main/student/store?toast=purchased`, matching the pattern used by the class/refund flows elsewhere in the app (the comment in the file explains this is intentional: the action already revalidates the path server-side, so the navigation is really about carrying the toast marker along with the fresh state). If `alreadyOwned` is true, renders a static "Owned"/"Active" badge instead of a buy button — the button itself never re-derives ownership, it trusts the `alreadyOwned` prop the page computed.
- **`equip-frame-button.tsx`** — Equips or unequips a cosmetic frame via `setActiveFrame(frameKey | null)`. `frameKey: null` means "Remove frame." When `isActive` is true it renders an "Equipped" badge plus a small "Remove" text link (not a full button) that clears the active frame; when false it renders the primary "Equip" button. This one calls `setActiveFrame` directly rather than `purchaseStoreItem` — equipping is free and separate from buying, so don't conflate the two actions.

## How it fits together

`app/main/student/store/page.tsx` is the only caller of both components today. It fetches store state once via `fetchStudentStoreState()` (also in `store.actions.ts`) and passes down `currentGems`, `alreadyOwned`/`isActive` flags, and `itemKey`/`frameKey` as props — these components never fetch their own data. Both actions they call (`purchaseStoreItem`, `setActiveFrame`) `revalidatePath` the store/dashboard/profile paths server-side, so a successful mutation is reflected on next render without these components managing cache invalidation themselves.

## Gotchas

- `PurchaseButton`'s `alreadyOwned` prop is always `false` when rendered for cosmetics in the "Profile Frames" shop section of the store page (the page branches to a static "Owned" badge itself before ever rendering the button in that case) — so don't assume `alreadyOwned` is exercised for every item type; check how the store page conditionally renders before "fixing" this.
- Neither component validates that `itemKey`/`frameKey` are legal values — that's enforced by TypeScript's `StoreItemKey` type at the call site and re-validated server-side in the action (e.g. "Frame not owned" / "Item not found" errors surface back through the `{ error }` return shape and are rendered inline).
- Both use the same `useTransition` + local `error` state pattern — if you add a third store-related button, match this shape rather than introducing a new one (e.g. a toast-only error path).

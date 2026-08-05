# app/main/student/store

Route directory for `/main/student/store` — the gem store page. Single file (`page.tsx`), an async Server Component; no client-side page logic lives here (that's `app/ui/main/store/`).

## Files

- **`page.tsx`** — Composes the whole store experience from data fetched via `fetchStudentStoreState()` and the static catalog `STORE_ITEMS` (`@/app/lib/store-catalog`). Sections, top to bottom:
  1. **Gem balance header** — big number, "Earn more by completing classes" hint.
  2. **Active boosts banner** — only rendered if `studyBoostActive` or `priorityBooking` is true; lists which one-shot perks are currently armed.
  3. **My Collection** — only rendered if the student owns ≥1 frame (`ownedFrames.length > 0`). Shows an avatar preview with the currently active frame applied (via `getFrameClass`) and a list of owned frame swatches, each with an `EquipFrameButton`.
  4. **Profile Frames shop** — all `cosmetic`-category items from `STORE_ITEMS`, each rendered as either a static "Owned" badge or a `PurchaseButton`.
  5. **Boosts shop** — all `boost`-category items (`study_boost`, `priority_booking`, `streak_freeze`). Note `streak_freeze` gets special-cased inline text ("You have N freezes banked") because it's the one boost that *stacks* rather than being a one-shot armed/consumed flag — see `isOwned()` below.
  6. **"How to earn gems"** static info card (completing a class +100, paying for a class +50, leaving a review +50) — hardcoded copy, not derived from `awardGems` call sites, so if reward amounts change elsewhere this text needs a manual update too.

## How it fits together

All data comes from two calls made in parallel (`Promise.all`): `fetchStudentStoreState()` (`@/app/lib/actions/store.actions`, reads `StudentGameProfile` + `User.avatarOptions`) and `searchParams` (for the `?toast=purchased` marker rendered via `<ToastNotification>`). The page itself contains two small local helper functions worth knowing about since they encode store-specific business rules directly in the page rather than in `store-catalog.ts`:
- `isOwned(key, frameKey)` — `study_boost`/`priority_booking` are "owned" iff their boolean flag is armed; a frame is "owned" iff its key is in `ownedFrames`; `streak_freeze` **always** returns `false` here regardless of how many are banked, specifically so it never renders as a static "Owned" badge and always stays purchasable (freezes stack, per the comment in the code).
- `ownedLabel(key)` — controls whether a purchased/armed item's badge says "Active" (the two consumable boosts) or "Owned" (cosmetics); not used for `streak_freeze` since that item never hits the "owned" branch.

Purchases go through `PurchaseButton` → `purchaseStoreItem(itemKey)`; frame equip/unequip goes through `EquipFrameButton` → `setActiveFrame(frameKey | null)`. Both are in `app/lib/actions/store.actions.ts`; see `app/ui/main/store/README.md` for the button components themselves.

## Gotchas

- The `allFrameKeys = ["scholar", "luminary", "sage"]` array in this page is a second, hand-maintained source of truth for which frame keys exist, parallel to `STORE_ITEMS`' `frameKey` fields — if a new frame is added to the catalog, it also needs to be added to this array or it won't show up in "My Collection" even after purchase.
- "How to earn gems" is prose, not generated from `STORE_ITEMS` or any reward-amount constant — a common drift point if gem amounts are rebalanced (e.g. in `worker/src/complete-classes.ts` or `classes.actions.ts`'s `completeClass`).
- The Active Boosts banner and the Boosts shop section both read `studyBoostActive`/`priorityBooking` from the same `fetchStudentStoreState()` call — there's no separate "is this expired" check; a boost is either armed (`true`) until consumed at its specific consumption site (payment route for `study_boost`, broadcast-request time for `priority_booking`) or it isn't.

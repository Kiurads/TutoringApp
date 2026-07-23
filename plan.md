# The Learning Nexus — Master Plan
> The product is branded "The Learning Nexus." Earlier phases of this doc (and some still-live DigitalOcean resource names — the app, its MySQL cluster, and database are all internally named `estudyou`) predate the brand name and haven't been renamed; see Phase 11C.

## Completed ✅
| Feature | Notes |
|---|---|
| Teacher ratings | Star picker on completed class; read-only if already submitted |
| Calendar view | Week grid with navigation, status-coloured blocks, current-time line |
| Action modals | Accept / refuse / cancel / pay all use inline modals; standalone pages removed |
| Notifications | All 6 class events (request, accept, refuse, cancel, pay, claim) notify the correct party |
| Gamification schema | `StudentGameProfile`, `TeacherGameProfile`, `Badge`, `UserBadge`, `TeacherAvailability` added; 10 badges seeded |
| Gamification logic | `awardGems`, `awardSparks`, `awardBadge`, `checkSessionBadges` in `app/lib/gamification.ts` |
| Gamification hooks | Payment → +50 gems; review → +50 gems / +75–100 sparks; class accepted → +50 sparks |
| Dashboard widgets | `NextUpCard`, `AcademicArcWidget`, `MentorMilestonesWidget` added to both dashboards |
| Class completion worker | `worker/` project; marks past-due `scheduled` classes `completed`, awards gems/sparks, checks badges (Phase 8, done) |
| Embedded Jitsi video | `Class.jitsiRoom`; `JoinClassCard`/`JitsiEmbed` on both class detail pages, time-window gated |
| Recurring classes (9A) | `RegularClass` request→accept→active lifecycle; `worker/src/regular-classes.ts` materializes real `Class` occurrences on a rolling 4-week window with a monotonic watermark; series cancel cancels only future non-terminal occurrences via the existing refund-tier logic |
| Class-detail authorization | Both `[id]/page.tsx` pages and all class-mutating actions now verify the caller is an actual participant (or admin) |

---

## Phase 3 — Profile & Settings Pages
> Schema fields already migrated (`learningStyle`, `learningGoal`, `teachingStyle`, `avatarFrame` on `User`).

### What to build
| File | Work |
|---|---|
| `app/lib/actions/users.actions.ts` | Add `updateProfile(data)` server action |
| `app/main/student/profile/page.tsx` | Form: first/last name, bio, learning style (select), learning goal (text) |
| `app/main/teacher/profile/page.tsx` | Form: first/last name, bio, teaching style (text), price/hour; on first save award +150 sparks via `teacherGameProfile.profileCompleted` one-time flag |
| `app/ui/main/users/profile-form.tsx` | Shared client-side form component |
| Student sidebar | Add "Profile" link |
| Teacher sidebar | Add "Profile" link |

### Verification
Visit `/main/student/profile`, update bio, confirm change persists. Visit `/main/teacher/profile`, save for first time, check `TeacherGameProfile.reputationSparks` incremented by 150.

---

## Phase 4 — Tutor Availability & Smart Scheduling
> `TeacherAvailability` model already migrated.

### 4A — Teacher sets weekly availability
| File | Work |
|---|---|
| `app/lib/actions/availability.actions.ts` | `fetchAvailability(teacherId)`, `setAvailability(slots[])` server actions |
| `app/main/teacher/availability/page.tsx` | Interactive weekly grid — click slots to toggle; save button calls `setAvailability` |
| `app/ui/main/availability/availability-grid.tsx` | Reusable 7-day × 24-slot toggle grid (30-min resolution) |
| Teacher sidebar | Add "Availability" link |

### 4B — Availability shown on teacher profile
| File | Work |
|---|---|
| `app/main/student/teachers/[id]/page.tsx` | Fetch availability + existing booked slots; render read-only grid; clicking a free slot navigates to `/main/student/classes/request?teacher=ID&startTime=...` |

### 4C — Counter-offer workflow
| File | Work |
|---|---|
| `prisma/schema.prisma` | Add `counterOfferTime DateTime?` to `Class`; add `counter_offer_proposed`, `counter_offer_accepted` to `NotificationType` enum |
| Migration | `pnpm prisma migrate dev --name add-counter-offer` |
| `app/lib/actions/classes.actions.ts` | Add `proposeCounterOffer(classId, newTime)` and `acceptCounterOffer(classId)` server actions |
| `app/ui/main/classes/details/class-action-modals.tsx` | Add "Suggest Alternative Time" button + date picker modal for teachers (only shown when `canAccept`) |
| `app/main/student/classes/[id]/page.tsx` | Show "New time proposed" banner with Accept / Decline when `counterOfferTime` is set |

### Verification
Set availability Mon 9–11am as teacher. As student, visit teacher profile — confirm Mon 9am slot appears free and clicking it pre-fills the request form. As teacher, open a requested class, propose a counter-offer time; confirm student sees the banner and can accept it.

---

## Phase 5 — Value-First Payment Gateway (Pre-Authorization)
> Restructures the payment flow: student pre-authorises at request time; teacher acceptance captures the charge automatically.

### 5A — Stripe manual capture
| File | Work |
|---|---|
| `app/lib/classes/create-class-as-student.ts` | After creating the class, create a Stripe PaymentIntent with `capture_method: "manual"`; store `intentId` via `createPayment` (amount=totalPrice, status=pre-authorized) |
| `app/lib/actions/classes.actions.ts` → `acceptClassById` | After updating status, call `stripe.paymentIntents.capture(intentId)`; set `paid=true` on class; send `class_paid` notification to student |
| `app/lib/actions/classes.actions.ts` → `refuseClassById` | Cancel the payment intent: `stripe.paymentIntents.cancel(intentId)` |
| `app/lib/actions/classes.actions.ts` → `cancelClassById` | If `paid=false` and intent exists, cancel intent. If `paid=true`, apply time-based refund logic (see below) |

### 5B — Pre-auth screen in request flow
| File | Work |
|---|---|
| `app/main/student/classes/request/page.tsx` | Add a second step: after form submission, redirect to authorize page with class data in query params |
| `app/main/student/classes/request/authorize/page.tsx` | New page — shows class summary + amount held; Stripe `PaymentElement` with `capture_method: manual`; on success creates class + payment record; awards +50 gems |
| `app/ui/payment/checkout-form.tsx` | Already accepts `classId`; needs a `mode="pre-auth"` variant that uses `setup_future_usage` or manual capture intent |

### 5C — Time-based cancellation refunds
In `cancelClassById`, replace the current "always full refund" logic:
- `startTime − now > 24h` → full refund (`stripe.refunds.create`)
- `12h < startTime − now ≤ 24h` → 50% refund (`amount: totalPrice * 50`)
- `startTime − now ≤ 12h` → no refund (cancel class, no Stripe call)

### Verification
Submit a class request — Stripe dashboard should show a PaymentIntent in `requires_capture` state. Accept as teacher — intent should transition to `succeeded` and `paid=true` in DB. Refuse as teacher — intent should be cancelled. Cancel as student with >24h to go — full refund issued.

---

## Phase 6 — Learning Profiles & Basic Matchmaking

### 6A — Onboarding survey (students)
| File | Work |
|---|---|
| `app/main/student/onboarding/page.tsx` | 3-step survey: (1) learning style select, (2) personality select, (3) goal text input. Saves to `User.learningStyle` / `User.learningGoal`. Skip button available. |
| `app/lib/actions/users.actions.ts` | Add `completeOnboarding(data)` server action |
| Middleware or layout | After first login, if `learningStyle` is null, redirect student to `/main/student/onboarding` |

### 6B — Tutor Fit Score
| File | Work |
|---|---|
| `app/lib/teachers/fit-score.ts` | New file — `computeFitScore(studentId, teacher)` returns 0–100. Rules: subjects used before (+30), avg rating ≥ 4.5 (+20), availability overlap with past session times (+20), repeat sessions with this teacher (+30) |
| `app/lib/actions/teachers.actions.ts` | Update `fetchTeachersExtended` to accept `studentId?` and attach `fitScore` to each teacher |
| `app/ui/main/teachers/teacher-browser.tsx` | Show `% Match` badge on each teacher card when fit score > 0 |
| `app/main/student/teachers/page.tsx` | Pass current user ID to `fetchTeachersExtended` |

### Verification
Complete the onboarding survey. Book and complete a class with Teacher A. Visit teacher browser — Teacher A should show a higher fit score than teachers you have never booked.

---

## Phase 7 — Gem Store & Badge Showcase

### 7A — Gem store (students)
| File | Work |
|---|---|
| `app/main/student/store/page.tsx` | New page — grid of purchasable items |
| `app/lib/actions/store.actions.ts` | `purchaseItem(userId, itemKey)` server action — deducts gems, updates `User.avatarFrame` or sets priority booking flag on `StudentGameProfile` |
| `prisma/schema.prisma` | Add `priorityBooking Boolean @default(false)` to `StudentGameProfile` |
| Student sidebar | Add "Store" link |

**Items:**
| Item | Gem cost | Effect |
|---|---|---|
| Avatar frame "Scholar" | 200 gems | Sets `User.avatarFrame = "scholar"` |
| Avatar frame "Luminary" | 500 gems | Sets `User.avatarFrame = "luminary"` |
| Priority booking token | 300 gems | Sets `StudentGameProfile.priorityBooking = true`; consumed when next class request is submitted |

### 7B — Badge showcase
| File | Work |
|---|---|
| Student profile page | Show full badge grid with earned/locked states |
| `app/main/student/teachers/[id]/page.tsx` | Show teacher's expertise seals (filtered `UserBadge` where `badge.category IN [expertise, pedagogy, milestone]`) |

### Verification
Student with 300+ gems visits store, purchases priority booking token. `StudentGameProfile.priorityBooking` becomes `true`. Visit teacher profile — teacher's earned expertise seals appear.

---

## Phase 8 — Class Completion Worker (microservice)
> Marks `scheduled` classes as `completed` when `startTime + duration ≤ now`, awards gems/sparks, sends notifications.

### What to build
| File | Work |
|---|---|
| `worker/package.json` | Node project; Prisma pointing at `../prisma/schema.prisma` |
| `worker/tsconfig.json` | TypeScript config |
| `worker/src/index.ts` | Polling loop every 5 minutes |
| `worker/.env` | Copy `DATABASE_URL` from main app `.env` |

### `worker/src/index.ts` logic
```ts
async function markCompletedClasses() {
  // Find scheduled classes past their end time
  const due = await prisma.$queryRaw`
    SELECT id, studentId, teacherId
    FROM Class
    WHERE status = 'scheduled'
      AND DATE_ADD(startTime, INTERVAL (durationInHours * 3600) SECOND) <= NOW()
  `;
  for (const cls of due) {
    await prisma.class.update({ where: { id: cls.id }, data: { status: 'completed' } });
    // Award gems + sparks
    await awardGems(cls.studentId, 100);
    await awardSparks(cls.teacherId, 20);
    await checkSessionBadges(cls.studentId, 'student');
    await checkSessionBadges(cls.teacherId, 'teacher');
    // Notify both parties
    await createNotification(cls.studentId, 'class_completed', ...);
    await createNotification(cls.teacherId, 'class_completed', ...);
  }
}
setInterval(markCompletedClasses, 5 * 60 * 1000);
markCompletedClasses(); // run on startup
```

### Setup steps (run manually)
```bash
cd worker && npm install
# create worker/.env with DATABASE_URL=...
cd worker && npx prisma generate --schema ../prisma/schema.prisma
cd worker && npm run dev   # dev
cd worker && npm start     # prod
```

---

## Phase 9 — Remaining Feature Gaps (from original plan)

### 9A — Regular classes UI — done ✅
See "Completed" table above. Not yet built on top of it: pausing/resuming a series without a full cancel, and editing a series' day/time/price after creation (currently cancel-and-recreate only).

### 9B — Admin user management
Currently admin can view students/teachers but cannot edit or delete.
| File | Work |
|---|---|
| `app/main/admin/students/[id]/page.tsx` | View + edit student; delete button with confirmation modal |
| `app/main/admin/teachers/[id]/page.tsx` | View + edit teacher; delete button |
| `app/lib/actions/users.actions.ts` | Add `adminUpdateUser(id, data)` and `adminDeleteUser(id)` server actions |

### 9C — Search & filter improvements
| File | Work |
|---|---|
| `app/ui/main/teachers/teacher-browser.tsx` | Already has subject filter; add price range slider and online-only toggle |
| `app/ui/main/classes/classes-table.tsx` | Add status filter (select) and date range filter (two date inputs) |

### 9D — Pagination
| File | Work |
|---|---|
| `app/lib/actions/classes.actions.ts` | Add `page` / `pageSize` params to `fetchClasses` and `fetchBookedClassesByUser` |
| `app/ui/main/classes/classes-table.tsx` | Add page navigation controls |
| `app/lib/actions/teachers.actions.ts` | Add pagination to `fetchTeachersExtended` |
| `app/ui/main/teachers/teacher-browser.tsx` | Add "Load more" or page controls |

### 9E — Email notifications
The `email/` directory exists but nothing sends mail.
| File | Work |
|---|---|
| `app/lib/email.ts` | Configure a transactional email provider (Resend or Nodemailer + SMTP) |
| `app/lib/notifications.ts` | After creating an in-app notification, optionally send an email for high-priority types (`class_requested`, `class_accepted`, `class_paid`) |

---

## Phase 10 — Polish & Reliability

| Item | Status |
|---|---|
| Mobile sidebar | ✅ Already implemented (daisyUI drawer + hamburger, `lg:hidden`) — this line was stale, not actually outstanding |
| Error boundaries | ✅ Done — `app/main/{student,teacher,admin}/error.tsx` added (previously only a single root `app/error.tsx`, which unmounted the whole app shell including the sidebar on any nested error). Each keeps the user in their own section with a "Try again"/"Go to dashboard" recovery path |
| Accessibility (modals) | ✅ Done — every modal across the app faked "open" with a CSS `modal-open` class instead of the real `<dialog>` API, so none of them had focus trapping or Escape-to-close. Converted all 10 (`class-action-modals.tsx` ×5, `regular-class-action-modals.tsx` ×3, `avatar-customizer.tsx`, `weekly-schedule.tsx`) to `ref` + `showModal()`/`close()`, matching the one modal that was already doing this correctly (`notification-dropdown.tsx`) |
| Accessibility (icon-only buttons/inputs) | ✅ Done for the representative set found in a full-app audit: sidebar hamburgers ×3, "New Class" buttons ×2, notification-dropdown close button, modal close buttons, theme toggle, badge tooltips, avatar/background swatch buttons (`aria-pressed` added since state was color-only) |
| Accessibility (form labels) | ✅ Done — added missing `htmlFor`/`id` pairing across `profile-form.tsx`, `change-password-form.tsx`, `subject-create-form.tsx`, `no-show-report-section.tsx`, `refund-request-actions.tsx`, and the counter-offer datetime input |
| Correctness bugs found during the audit | ✅ Fixed — 6 submit buttons used `aria-disabled` instead of `disabled` (stayed clickable during submission: `login-form.tsx`, `register-student-form.tsx`, `register-teacher-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `create-class-form.tsx`); `DeleteTeacherButton` had no pending guard at all (double-click could fire two deletes) — also refactored `deleteTeacherById` to stop calling `redirect()` internally, since a client `onClick` caller wrapping it in try/catch (needed for real error handling) would have swallowed Next's internal redirect-signal error; the button now navigates itself via `useRouter()` on success. `complete-class-button.tsx` used a blocking native `alert()` for errors instead of the inline banner pattern used everywhere else |
| Skeleton loaders | Still open — no `loading.tsx` exists anywhere in the app (confirmed via `find app -name "loading.tsx"`), so slow data fetches show a blank page rather than a skeleton |
| DaisyUI v5 theme fix | Still open, not re-verified this pass (needs a browser to actually see the rendered color) — primary colour may still fall back to default purple because v5 ignores `tailwind.config.ts` theme |
| Keyboard accessibility, calendar & availability grids | **New finding, not fixed** — `app/ui/main/calendar/weekly-schedule.tsx` and `app/ui/main/availability/availability-grid.tsx` are both pure mouse-drag interactions (`onMouseDown`/`onMouseMove`, no `onKeyDown`, no `tabIndex` on cells). A keyboard-only user cannot schedule a class from the calendar view or set fine-grained availability at all. Deliberately out of scope for this pass — it's an interaction redesign (needs a real keyboard equivalent for multi-cell drag-select), not a mechanical fix like the rest of this list |
| Footer dead features | **New finding, not fixed** — `app/ui/footer.tsx`: the newsletter signup form has no `action`/`onSubmit` at all (Subscribe does nothing), and the social links point to internal placeholder routes (`/facebook`, `/twitter`, `/linkedin`) rather than real URLs. Low priority — content/marketing issue, not core app UX |

---

## Phase 11 — Pre-Launch / Production Readiness
> Audited directly against the current codebase (env vars via `grep -r process.env`, third-party calls, CI config) before deciding to publish. Grouped by blast radius. **11A and 11B are fully merged to `master`** (PRs #19–#23); 11C (hosting) and 11D (legal) remain genuinely not started — see "Still remaining" below.

### 11A — Third-party service resilience — ✅ merged
Merged via PR #22 (`feat/auth-hardening-for-launch`) plus PR #23 (`fix/lazy-stripe-client-init`, found while getting CI green — see 11B).

**Nextcloud integration discarded (2026-07-22)**, not just deferred: the teacher-account-provisioning sync in `register-teacher.ts` (`addNextcloudUser` and its env vars) was removed entirely rather than left unconfigured, since the product decision is to drop it, not to fix it later.
| Item | File(s) | Status |
|---|---|---|
| No rate limiting on login/register | `app/lib/auth/rate-limit.ts` | Added — in-memory fixed-window limiter, per-email and per-IP. Documented as a single-instance stopgap: resets on restart, doesn't coordinate across horizontally-scaled instances (would need Redis at that point) |
| `Resend` installed but never called; no verification/reset flow | `app/lib/email.ts`, `app/lib/auth/verification.ts`, `app/api/auth/verify/route.ts`, `request-password-reset.ts`, `reset-password.ts`, `/forgot-password`, `/reset-password` pages | Done — uses the schema's existing `VerificationToken` model; email send is best-effort (logs instead of throwing if `RESEND_API_KEY` is unset). Login is **not** gated on `emailVerified` yet — intentionally deferred, not a bug |
| `authenticate.ts` redirects to non-existent `/dashboard` | `app/lib/auth/authenticate.ts` | Fixed — redirects to `/` and lets `auth.config.ts`'s `authorized()` callback route by role |
| Shared Stripe client crashed `next build` without `STRIPE_SECRET_KEY` at build time | `app/lib/stripe.ts` | Fixed (found by the new build gate's first real run) — was constructed eagerly at module scope; now a lazy `getStripe()`, matching the other two Stripe call sites |
| Stripe still presumably in test mode | `app/lib/stripe.ts`, Stripe dashboard | Still open — external account action, no code branch |
| `meet.jit.si` public server | `app/ui/main/classes/details/jitsi-embed.tsx` | Accepted risk, no action planned pre-launch |

### 11B — Ops/infra baseline — ✅ merged
Merged via PRs #19, #20, #21.
| Item | Status |
|---|---|
| No `.env.example` | Done — documents `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, Stripe keys, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` (Nextcloud vars removed — see 11A) |
| CI only ran `pnpm test` | Done — added `lint`, `typecheck` (`tsc --noEmit`), and `build` steps to `.woodpecker.yml`. Also fixed the underlying GitHub→Woodpecker webhook itself, which had been silently failing ("failure to parse token from hook") on every push/PR since before this work started — the repo had to be reactivated in Woodpecker to regenerate a valid webhook token before any of this CI could actually run |
| No health-check surface for `web` or `worker` | Done — `/api/health` (checks real DB connectivity) on the web app; the worker got a minimal built-in-`http` `/health` endpoint that reports unhealthy if either poll loop stalls beyond 2x its interval |
| No error monitoring, just scattered `console.log`/`console.error` | Still open — wire Sentry (or equivalent) once a hosting target is picked |

### 11C — Hosting — ✅ live on DigitalOcean
Decision: **DigitalOcean App Platform + DO Managed MySQL**, not Railway/Render/Fly. Researched July 2026 (see below); revisit if pricing/reliability shifts materially.

**Provisioned and live** as of 2026-07-22: app `estudyou` (ID `f4b97948-e5a9-4ef3-86c0-d24e622d7a4e`) at `https://estudyou-g7mfy.ondigitalocean.app`, region `fra` (Frankfurt — chosen for a Europe-based audience). MySQL cluster `estudyou-mysql` (region `fra1`, `db-s-1vcpu-1gb`, single node, database `estudyou`) all 19 migrations applied. `web` and `worker` both deploy automatically on push to `master` (`deploy_on_push: true`); `/api/health` confirms real DB connectivity, worker confirmed running its poll loop with no errors.

Two real bugs surfaced only by actually deploying (fixed via PR #25, `fix/do-deploy-issues`):
- DO's app spec validator rejects a `production: true` database without `cluster_name` — App Platform can't provision a production DB inline, it must reference a pre-existing cluster. Fixed by creating the cluster via `doctl databases create` first and binding `DATABASE_URL` through App Platform's `${estudyou-db.DATABASE_URL}` interpolation (also gets automatic trust of DO's database CA for free — no manual SSL/CA handling needed).
- DO's managed MySQL enforces `sql_require_primary_key`. `VerificationToken` had no primary key (only a composite unique index), so the very first migration failed against the real cluster. Fixed by changing `@@unique([identifier, token])` to `@@id([identifier, token])` in `prisma/schema.prisma` — verified this doesn't change the generated client's `identifier_token` compound-key accessor name, so no application code needed to change.

Still open: real secret values (Stripe, Resend) — see "Still remaining" below.

Two-service shape as originally planned: `web` (Next.js, autoscale-capable) + `worker` (must stay single-instance — it's a polling loop with no distributed lock, and the rate limiter added in 11A is also in-memory-per-instance), sharing one managed MySQL cluster. External integrations stay as direct HTTPS calls: `web` ↔ Stripe, browser → `meet.jit.si` directly, `web`/Next-Image → `api.dicebear.com`, `web` → Resend.

Why DO over the alternatives:
- **Render** has no native managed MySQL (only Postgres/Redis) — MySQL there means a hand-rolled, self-backed-up container.
- **Railway** supports MySQL natively but as an *unmanaged* container (no built-in failover/backups), and had multiple platform-wide outages in 2026 (a May GCP-account-suspension incident took the whole control plane down ~8h; a February bad-anti-fraud-rule incident auto-killed legitimate deployments).
- **Fly.io** likewise has no native managed MySQL (Postgres only) and had its own 2026 reliability incidents tied to its Consul/Corrosion coordination layer.
- **DigitalOcean** is the only one of the four offering an actually managed MySQL (auto failover, daily backups, PITR) at comparable cost, plus a 99.95% uptime SLA — worth the (small) premium for an app about to handle real Stripe payments and user data.

Estimated cost (launch scale, single-node DB — see "Still remaining" below for when to upgrade to HA):
| Component | Size | Cost |
|---|---|---|
| `web` | 1 vCPU / 1 GiB | $12/mo |
| `worker` | 1 vCPU / 512 MiB | $5/mo |
| MySQL (single-node, no failover — dev/test tier, acceptable pre-revenue risk) | 1 vCPU / 1 GiB | $15/mo |
| **Total** | | **~$32/mo**, before Stripe's per-transaction cut |

Upgrading to HA MySQL (auto-failover primary+standby) + dedicated/autoscaling `web` compute once there's real user data on the line: ~$120/mo. Do this before depending on it for paying customers, not at initial launch.

Deploy config merged via PR #24 (`chore/digitalocean-deploy-config`) and PR #25 (`fix/do-deploy-issues`): root `Dockerfile` (web, multi-stage, `pnpm start`), `worker/Dockerfile` (built with repo root as context — the worker resolves `@prisma/client` and `app/lib/**` from the root project, not its own), `.dockerignore`, and `.do/app.yaml` (App Platform spec: `web` + `worker` + `estudyou-db` MySQL). Both Dockerfiles smoke-tested locally before deploy (build + boot against a fake DB, confirmed graceful failure not a crash).

### 11D — Legal/compliance — still not started
No terms of service, privacy policy, or cookie consent surface exists. Needs real legal review, not placeholder text — deliberately not drafted by an agent.

---

## Still remaining, in order

1. ~~Fill in real secret values~~ — ✅ done. `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`/`FROM_EMAIL` (Resend sandbox `onboarding@resend.dev` — no custom domain verified yet), and **live-mode** Stripe keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) are all set on the live app. Webhook registered at `https://estudyou-g7mfy.ondigitalocean.app/api/webhooks/stripe`, subscribed to `payment_intent.succeeded/.payment_failed/.canceled`, `charge.refunded`, `charge.dispute.created` — all 5 handled (PR #27, `feat/stripe-webhook-event-handling`); the four beyond `.succeeded` log for manual reconciliation (no error monitoring yet) and disputes additionally email every admin via Resend. **Nextcloud integration was discarded outright** (PR #26), not configured — see 11A.
   - ⚠️ Live keys mean real charges process now. Recommended before fully trusting it: one manual pre-auth→capture→refund test through the real UI with a real card.
2. **Custom domain + DNS** — currently only reachable at `estudyou-g7mfy.ondigitalocean.app`. Also blocks verifying a real Resend sending domain (currently on their sandbox address, which only delivers to your own Resend account). Good time to also revisit renaming the underlying DO app/database resource names from `estudyou` to match the brand (deliberately left alone for now — see the note at the top of this doc).
3. **Error monitoring** (11B) — pick a target (Sentry or similar) and wire it into both `web` and `worker`, now that a deploy target exists for the DSN/release tag.
4. **Stripe live mode** — switch keys, register the production webhook URL against the real domain from step 2, run one full manual pre-auth→capture→refund test.
5. **Legal pages** (11D) — terms of service, privacy policy, cookie consent — needs business/legal input, not more code.
6. **Feature-roadmap backlog**, lower priority than the above: Phase 9B (Admin CRUD), 9C/9D (search/filter + pagination), Phase 10 (polish pass).

Note: none of the merged Phase 11 work has been build/typecheck/test-verified on a real Node 20+ install by a human before this session — it has now been verified: `tsc --noEmit` and `pnpm test` (306 passing) both run locally on Node 20+ while fixing the deploy issues above.

Known follow-ups from this pass, not yet scoped into a phase:
- Presence-based reliability sparks (Jitsi join/leave events) — deferred until the completion worker's definition of "session happened" was validated in practice
- Recurring series editing (day/time/price) without a full cancel-and-recreate

## Refund → gamification point reversal
Gems/sparks were awarded from multiple, inconsistent call sites (accept: 50/50, worker auto-complete: 100/20, manual "Mark Complete": 50/25) with no record anywhere of which path fired or how much a given class had actually granted — a refund had no way to know what to claw back. Added `Class.gemsAwarded`/`sparksAwarded` (running totals, incremented by whichever award path actually fires) and `Class.pointsReversed` (idempotency guard) via migration `20260722205907_add_class_points_tracking`, plus `reverseClassPoints()` in `app/lib/gamification.ts`, wired into all 4 real refund trigger points: `cancelClassCore`'s full/50% refund branches, and `expireIfNeeded`/`acceptRefundRequest`/`adminResolveRefundRequest` in `refund-requests.actions.ts`.

Also fixed a real bug this surfaced: `awardGems`/`awardSparks` fired their "Tier Up!"/"Rank Up!" congratulatory notification on *any* tier change, not just increases — a negative (reversal) amount that dropped a tier would have wrongly congratulated the user. Now gated on `newTier > oldTier`, and both functions floor at 0 instead of letting a reversal go negative.

Scoping decisions worth confirming, not obviously "the only correct answer":
- A 50%-refund cancellation (12–24h before start) still reverses the *full* point award, not half — gems/sparks aren't meaningfully divisible, and the award was for the class happening, not which fraction of the price came back.
- Review-based gems/sparks (`ratings.actions.ts` — 50 gems to the reviewer, 75–100 sparks to the teacher) are deliberately **not** tracked/reversed. A no-show refund happens before a review could exist, but the completed-class refund-request paths (no-show/dispute after the fact) could technically overlap with an already-left review — left out of scope since reversing it would also mean un-awarding any badge that review triggered (e.g. "Feedback Champion").
- The pre-existing "unconditional spark award on accept regardless of whether payment capture actually succeeded" (`acceptClassById`) was left as-is — tightening it was out of scope for this task, and since an unpaid class can never actually be refunded anyway (no `Payment` row to refund), any sparks awarded in that edge case just never get clawed back, same blast radius as before this change.

## Gamification improvement pass (streaks, quests, variable rewards)
Researched current gamification practice (streaks, quests, milestone celebrations, variable rewards, and — importantly — the ethical-design literature on loss-aversion/dark-pattern engagement loops) before building. Audited the existing system first: two schema fields (`streakDays`, `lastActivityAt`) and two badges (`streak_7`, `streak_30`) had been sitting completely dead since Phase 7 — no code ever read or wrote them. `engaging_educator` (pedagogy badge) and `NotificationType.gem_received` were similarly orphaned.

**Weekly activity streak** (not daily): tutoring's natural cadence is weekly/biweekly sessions, not daily practice, so a Duolingo-style daily streak would punish completely normal usage. The unit is "a week with at least one completed class." Repurposed `streakDays` → `currentStreakWeeks` (migration `20260722214813_add_streaks_and_quests` — the column was unused in every real row, so this is a safe rename, not a data migration), added `longestStreakWeeks` (a personal-best record, never reset) and `streakFreezes`. A single missed week is covered by a freeze instead of resetting to 0; freezes are **earned for free every 4-week streak**, not sold as anxiety relief the way Duolingo's paid streak freezes are — though a `streak_freeze` item (150 gems) was also added to the gem store as an optional extra. Deliberately **does not notify when a streak breaks** — the ethical-gamification research is explicit that loss-aversion push notifications on disengagement (the mechanic behind Snapchat's streak-anxiety problem) create real distress without a matching retention benefit; the user just sees the reset count next time they check their dashboard. `streak_7`/`streak_30` badges (renamed "Steady Streak"/"Unstoppable", now meaning 4-week/12-week streaks) finally have real award logic, shared between students and teachers.

**Variable reward**: a flat 10% chance of a small bonus (+25 gems / +15 sparks) on class completion — a single, transparent, always-positive mechanic (never a loss, never a loot-box-style rarity ladder), the "surprise and delight" pattern without the manipulative edge some variable-reward implementations have. Tied into the same `Class.gemsAwarded`/`sparksAwarded` tracking from the refund-reversal work, so a lucky bonus gets clawed back too if that class is later refunded.

**Weekly quests**: a small fixed set (not an admin-configurable catalog — "purpose over points" beat a sprawling checklist), computed live from `Class`/`TeacherRating` rows rather than tracked incrementally — "Complete 2 classes this week" / "Leave a review this week" (students), "Complete 3 classes this week" (teachers). New `QuestClaim` table only exists to make claiming idempotent per user per week; progress itself is always re-derived, never trusted from the client.

**Other fixes made along the way**: `awardBadge`'s notification always linked to `/main/student/dashboard` even for teacher badges — fixed to take a role. `engaging_educator` (previously orphaned) now fires on reaching Elite Mentor rank.

Deliberately not built (would roughly double this task's scope): an admin-configurable quest catalog, a teacher-facing gem-equivalent store beyond the new streak-freeze purchase, and leaderboards — the research flagged leaderboards as needing careful community framing to avoid toxic comparison, and this app's student base plausibly includes minors, so skipped rather than done half-carefully.

Verified: `tsc --noEmit` clean, `pnpm lint` clean, `pnpm test` (390/390 passing, 41 new), and a production `pnpm build` succeeds. Not run against a real database or verified in a browser this session — worth applying the migration, re-running `prisma/seed-badges.ts` (badge name/description text changed), and exercising one real streak/quest/lucky-bonus path before fully trusting it.

## First-login welcome tour + preferences
Added `User.hasCompletedOnboarding` (migration `20260722224822_add_onboarding_flag`, backfilled to `true` for all existing rows so nobody already using the app suddenly sees a "first login" tour — only genuinely new registrations start at `false`). A lightweight informational carousel modal (`app/ui/onboarding/welcome-tour-modal.tsx`, 3 slides: welcome → core feature → gamification intro), not a DOM-element-spotlighting tour — no tour library (react-joyride etc.) was installed, and adding one plus wiring element-highlighting across every page would be a much bigger scope decision than this task needed.

The modal's final slide offers "Set up my preferences," landing on the existing student onboarding page (`/main/student/onboarding` — already existed, reused as-is) or a **new** teacher equivalent (`/main/teacher/onboarding` — teachingStyle + pricePerHour, mirroring the student page's two-step wizard style; teachers previously had no dedicated onboarding flow at all, only the generic profile-edit form). Also added a "Preferences" sidebar link for teachers (`TeacherSidebar.tsx`), matching the student sidebar's existing one.

Deliberately decoupled "tour seen" from "preferences actually set": `hasCompletedOnboarding` flips to `true` the moment the tour is dismissed (finished, skipped, or closed via Escape) — it never reappears — regardless of whether the user follows through to the preferences page immediately, later, or never. Preferences themselves stay exactly as freely revisitable as before (student onboarding was never gated as first-time-only; same now for teachers). This matches the app's existing low-friction, non-nagging onboarding philosophy rather than forcing a multi-step gate before reaching the dashboard.

Verified: `tsc --noEmit` clean, `pnpm lint` clean, `pnpm test` (392/392 passing, 2 new), and a production `pnpm build` succeeds — `/main/teacher/onboarding` compiles as a real route. Not run against a real database or verified in a browser this session.

### Follow-up: re-trigger bug fix, driver.js migration, mandatory teacher onboarding
Three issues surfaced after shipping the above and were fixed together:

**Re-trigger bug.** Root cause: `completeOnboardingTour()` updated the DB but never called `revalidatePath`, so the Next.js client Router Cache kept serving the pre-completion RSC payload for `/main/{student,teacher}/dashboard` on the next visit (the DB value was always correct — this was a client cache staleness bug, not a data bug). Fixed by adding `revalidatePath("/main/student/dashboard")` / `revalidatePath("/main/teacher/dashboard")` to `completeOnboardingTour()`, matching the existing pattern in `updateProfile()`.

**Tour rebuilt on driver.js.** `welcome-tour-modal.tsx` no longer renders its own `<dialog>` carousel — it drives `driver.js` against real dashboard elements. `allowClose` toggles per role: `true` for students (X button, overlay click, Escape all still dismiss it, same low-friction philosophy as before), `false` for teachers (none of those work — driver.js hides the close button and disables overlay/Escape dismissal entirely when `allowClose` is `false`, confirmed by reading the library source directly rather than assuming). A single global `onDestroyed` hook is the only place `finish()` is called from. An `isCleanupDestroy` flag guards against React StrictMode's dev-mode double-invoke (mount→cleanup→mount) from firing the completion side effect prematurely — effect cleanup also calls `driverObj.destroy()`, which would otherwise look identical to a real dismissal.

**Mandatory teacher onboarding — enforced server-side, not just in the UI.** Making the tour itself unskippable isn't sufficient on its own (a teacher could just type the dashboard URL directly), so the real gate is `middleware`-level: `auth.config.ts`'s `authorized` callback redirects any teacher whose `teachingStyle` is still `null` to `/main/teacher/onboarding` on every request, for every `/main/teacher/*` route except that one. This required threading a new `teacherPreferencesSet` boolean through the JWT (`auth.ts`'s `authorize()` computes it at login as `teachingStyle !== null`; `types/next-auth.d.ts` declares it on `User`/`Session`/`JWT`) and refreshing it via NextAuth's `session.update()` trigger the moment the teacher submits the preferences form (`app/main/teacher/onboarding/page.tsx`) — otherwise the JWT would keep saying `false` until the next full login and middleware would loop the teacher back to the form it just submitted. The "Skip for now" button was removed from that page entirely.

One accepted side effect: this gate applies to *any* teacher account with `teachingStyle: null`, not only ones created after this change — a pre-existing teacher who never set a teaching style will also be routed to the onboarding form on their next login. This was a deliberate call (existing incomplete profiles should be nudged to complete them) rather than an oversight; flagging it here in case it needs revisiting.

**Preferences-first ordering for students too, and richer tour content.** Originally the tour played immediately on a student's first dashboard visit, with its last slide optionally offering to "set up preferences" afterward. Feedback was that the tour content was too generic and that preferences should come first for everyone, not just teachers. Both are fixed together:
- `app/main/student/dashboard/page.tsx` now redirects a first-time student (`!hasCompletedOnboarding`) straight to `/main/student/onboarding`, *unless* the URL carries `?tour=1`. That query param is how `app/main/student/onboarding/page.tsx`'s `handleSkip` and `handleFinish` hand the student back to the dashboard afterward (`router.push("/main/student/dashboard?tour=1")`) — without it, the redirect would just bounce them straight back and the tour would never show. Unlike the teacher gate, this is a soft, page-level redirect (skip is still allowed on the preferences form itself) rather than a middleware-enforced one, matching the existing low-friction philosophy for students — it only reorders *when* the tour appears, it doesn't make preferences mandatory.
- Because preferences are now handled (or deliberately skipped) *before* the tour for both roles, the tour's last step no longer needs a "go set up your preferences" CTA at all — `buildSteps()` in `welcome-tour-modal.tsx` dropped the `data.destination` mechanism entirely; `onDestroyed` just calls `finish()` with no destination, ever.
- Tour content was rewritten from generic feature-marketing copy to specific mechanics, and extended from 3 steps to 5 per role, spotlighting real elements: students get `next-up-card` (explains the live countdown), `nav-teachers` (the two ways to book), `academic-arc-widget` (gems/tiers/streak mechanics, including the streak-freeze escape hatch), and `weekly-quests-widget` (that quests reset Monday and don't roll over). Teachers get a new `online-toggle` step (`data-tour` added to `TeacherSidebar.tsx`'s toggle button — explains that only online teachers surface for on-demand requests), `nav-classes` (now also mentions the adjacent Availability link), `mentor-milestones-widget`, and the same `weekly-quests-widget` step. `data-tour="next-up-card"` was added to both of `next-up-card.tsx`'s return branches; `data-tour="weekly-quests-widget"` to `weekly-quests-widget.tsx`'s root.

Added `auth.config.test.ts` (10 tests) covering the `authorized`/`jwt`/`session` callbacks directly, since this gate is security-relevant and had no prior test coverage. Verified: `tsc --noEmit` clean, `pnpm lint` clean, `pnpm test` (402/402 passing), production `pnpm build` succeeds. Note on tooling: this sandbox's default `node` (v18.19.1) is too old for the pinned `vitest`/`vite`/`rolldown` toolchain (`node:util`'s `styleText` export requires Node ≥ 20); a Node 24.11.1 install already present at `/usr/local/n/versions/node/24.11.1/bin` was used instead for all verification in this session. Not run against a real database or verified in a browser this session.

# eStudyou — Master Plan

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

| Item | File | Work |
|---|---|---|
| Skeleton loaders | `app/ui/main/classes/classes-table.tsx`, `app/ui/main/teachers/teacher-browser.tsx` | Wrap data fetch in Suspense; add `loading.tsx` skeleton files |
| Mobile sidebar | `app/main/student/_components/StudentSidebar.tsx`, teacher equivalent | Collapse to hamburger/bottom nav below `md` breakpoint |
| Error boundaries | `app/main/student/error.tsx`, teacher equivalent | Replace bare stubs with informative error UI + retry button |
| Accessibility | All modals, icon-only buttons | Add focus traps in modals; `aria-label` on all icon-only buttons |
| DaisyUI v5 theme fix | `app/globals.css` or downgrade to `daisyui@4` | Primary colour currently falls back to default purple because v5 ignores `tailwind.config.ts` theme — either downgrade to v4 or move theme to CSS custom properties |

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

1. **Fill in real secret values** (11C) — `AUTH_SECRET`/`NEXT_PUBLIC_APP_URL` are set; `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`/`FROM_EMAIL` are still placeholders on the live app — needs real third-party credentials filled in via the DO dashboard.
2. **Custom domain + DNS** — currently only reachable at `estudyou-g7mfy.ondigitalocean.app`.
3. **Error monitoring** (11B) — pick a target (Sentry or similar) and wire it into both `web` and `worker`, now that a deploy target exists for the DSN/release tag.
4. **Stripe live mode** — switch keys, register the production webhook URL against the real domain from step 2, run one full manual pre-auth→capture→refund test.
5. **Legal pages** (11D) — terms of service, privacy policy, cookie consent — needs business/legal input, not more code.
6. **Feature-roadmap backlog**, lower priority than the above: Phase 9B (Admin CRUD), 9C/9D (search/filter + pagination), Phase 10 (polish pass).

Note: none of the merged Phase 11 work has been build/typecheck/test-verified on a real Node 20+ install by a human before this session — it has now been verified: `tsc --noEmit` and `pnpm test` (306 passing) both run locally on Node 20+ while fixing the deploy issues above.

Known follow-ups from this pass, not yet scoped into a phase:
- Presence-based reliability sparks (Jitsi join/leave events) — deferred until the completion worker's definition of "session happened" was validated in practice
- Recurring series editing (day/time/price) without a full cancel-and-recreate

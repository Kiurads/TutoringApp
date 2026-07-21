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
> Audited directly against the current codebase (env vars via `grep -r process.env`, third-party calls, CI config) before deciding to publish. Grouped by blast radius; branch names are the actual branches this work happens on.

### 11A — Third-party service resilience (highest risk — do first)
| Item | File(s) | Branch | Work |
|---|---|---|---|
| Nextcloud sync blocks teacher registration | `app/lib/auth/register-teacher.ts` | `feat/auth-hardening-for-launch` | `addNextcloudUser()` currently runs *before* the `User` row is created and throws on failure — a Nextcloud outage currently means **zero new teacher signups**. Make it best-effort: create the `User` first, attempt Nextcloud sync after, catch/log failures instead of aborting registration. |
| Real password forwarded to Nextcloud | same file | same | The teacher's actual site password is sent as their Nextcloud password. Generate an independent random credential instead. |
| No rate limiting on login/register | `app/lib/auth/authenticate.ts`, `register-student.ts`, `register-teacher.ts` | same | Add basic per-IP/per-email throttling to deter credential stuffing and signup spam. |
| `Resend` dependency installed but never called; no email verification or password reset flow despite `User.emailVerified` and `VerificationToken` already in the schema | new `app/lib/email.ts`, register/login actions | same | Wire Resend, implement verification-on-signup and forgot/reset-password using the existing `VerificationToken` model. |
| `authenticate.ts` redirects to non-existent `/dashboard` | `app/lib/auth/authenticate.ts` | same | Redirect to `/` instead and let `auth.config.ts`'s `authorized()` callback route to the correct role dashboard — known bug, noted below since 9A, not yet fixed. |
| Stripe still presumably in test mode | `app/lib/stripe.ts`, Stripe dashboard | *(external — no code branch)* | Switch to live keys, register the production webhook URL, do one full manual pre-auth→capture→refund test against it before go-live. |
| `meet.jit.si` public server | `app/ui/main/classes/details/jitsi-embed.tsx` | *(accepted risk)* | Fine to launch on; no SLA/privacy guarantees — document as a known limitation, revisit self-hosting post-launch if volume justifies it. |

### 11B — Ops/infra baseline
| Item | Branch | Work |
|---|---|---|
| No `.env.example` anywhere — nothing documents the required vars for a new environment | `chore/pre-launch-env-docs` | Enumerate `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXTCLOUD_URL/USERNAME/PASSWORD`, `RESEND_API_KEY` |
| CI only runs `pnpm test`, no build/lint/typecheck gate | `ci/build-lint-typecheck-gate` | Extend `.woodpecker.yml` with `next lint` + `tsc --noEmit` + `next build` steps — two of the last ten commits were "fix production build" / "fix missing route handler," exactly what this would catch pre-merge |
| No health-check surface for `web` or `worker` | `feat/health-check-endpoints` | Add `/api/health` to the Next app; give the worker a minimal heartbeat/HTTP endpoint so a host can detect a dead polling loop |
| No error monitoring, just scattered `console.log`/`console.error` | *(queued, not started)* | Wire Sentry (or equivalent) once a hosting target is picked |

### 11C — Hosting (recommendation, not yet provisioned)
Two-service container platform (Railway/Render/Fly — any works) rather than pure-serverless: the `worker/` process is a long-lived polling loop (not naturally serverless) and must run as exactly one instance. `web` (autoscaled) + `worker` (single instance) share one managed MySQL instance. External integrations stay as direct HTTPS calls: `web` → Stripe (server SDK) and Stripe → `web` (signed webhook), `web` → Nextcloud (OCS API), browser → `meet.jit.si` directly (app only hands over a room name), `web`/Next-Image → `api.dicebear.com`, `web` → Resend once wired. Nothing here is provisioned yet — needs real accounts/credentials, so it's tracked but not a code branch.

### 11D — Legal/compliance (needs business input, not just code)
No terms of service, privacy policy, or cookie consent surface exists. Flagged here rather than drafted — this needs real legal review, not placeholder text generated by an agent.

---

## Recommended order going forward

Phases 3–9A are all done (see "Completed" table). Feature-roadmap remaining:
1. **Phase 9B** (Admin CRUD) — students/teachers currently list-only
2. **Phase 9C/9D** (Search/filter + pagination)
3. **Phase 9E** (Email) — superseded/absorbed by 11A's Resend wiring, tie into completion-worker and recurring-occurrence notifications first
4. **Phase 10** (Polish) — final quality pass before launch

Pre-launch readiness (Phase 11) should land before Phase 9B–10 is worth prioritizing further — 11A is the highest-risk item (Nextcloud can currently zero out teacher signups with no fallback).

Known follow-ups from this pass, not yet scoped into a phase:
- Presence-based reliability sparks (Jitsi join/leave events) — deferred until the completion worker's definition of "session happened" was validated in practice
- Recurring series editing (day/time/price) without a full cancel-and-recreate

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

### 9A — Regular classes UI
The `RegularClass` model exists (dayOfWeek, startTime, durationInHours, status). No UI exists.
| File | Work |
|---|---|
| `app/main/teacher/regular-classes/page.tsx` | List + create regular class form |
| `app/main/student/regular-classes/page.tsx` | View enrolled regular classes |
| `app/lib/actions/regular-classes.actions.ts` | CRUD actions |
| Teacher sidebar | Add "Regular Classes" link |

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

## Recommended order going forward
1. **Phase 3** (Profile) — unblocks teacher sparks one-time reward and Phase 6 onboarding
2. **Phase 4** (Availability + counter-offer) — highest UX value for scheduling
3. **Phase 5** (Pre-auth payment) — core trust feature; test with Stripe carefully
4. **Phase 8** (Worker) — needed for gems-on-completion and badge milestones
5. **Phase 6** (Onboarding + fit score) — relies on profile data
6. **Phase 7** (Store + showcase) — final gamification layer
7. **Phase 9** (Feature gaps) — regular classes, admin, filters, pagination, email
8. **Phase 10** (Polish) — final quality pass before launch

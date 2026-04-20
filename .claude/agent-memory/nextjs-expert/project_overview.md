---
name: eStudyou Project Overview
description: Core purpose, tech stack, and architecture of the tutoring platform app
type: project
---

eStudyou is a tutoring marketplace platform (Next.js 15 app) that connects students with teachers for private tutoring sessions.

**Why:** This is the primary project being worked on. Understanding its structure and purpose is foundational to all future work.

**How to apply:** Use this as the baseline mental model when answering questions or implementing features. All features should fit within the student/teacher/admin role model.

## Tech Stack
- **Framework:** Next.js 15.1.3 with App Router and Turbopack
- **Language:** TypeScript 5
- **Database:** MySQL via Prisma ORM 6.3.1
- **Auth:** NextAuth v5 (beta) with Credentials provider + PrismaAdapter, JWT sessions
- **Payments:** Stripe (stripe-js, react-stripe-js, webhook handler)
- **Email:** Resend
- **UI:** Tailwind CSS + DaisyUI 5 (beta) + react-icons + chart.js / react-chartjs-2
- **Password hashing:** bcryptjs

## User Roles (Prisma enum)
- `student` — books classes, pays via Stripe, rates teachers
- `teacher` — accepts/refuses class requests, tracks earnings
- `admin` — manages platform (teachers, students, subjects, payments, classes)

## Data Models (Prisma / MySQL)
- **User** — shared model for all roles; teacher-specific fields: pricePerHour, teacherSubject, teacherRating
- **Subject** — subjects teachers can teach
- **TeacherSubject** — join table linking teachers to their subjects
- **Class** — one-off tutoring session; status: requested → scheduled → completed / refused; paid boolean
- **RegularClass** — recurring weekly class (dayOfWeek based)
- **TeacherRating** — students rate teachers after a class
- **Payment** — created via Stripe webhook on payment_intent.succeeded; links class, student, teacher, amount, intentId

## Auth Flow
- Credentials-only login (email + bcrypt password)
- Role injected into JWT token and session
- Middleware enforces role-based routing: students → /main/student/*, teachers → /main/teacher/*, admins → /main/admin/*
- Unauthenticated users hitting /main/* are redirected to /login
- Authenticated users hitting / or wrong-role paths are redirected to their role dashboard

## API Routes
- `POST /api/auth/register/student` — student self-registration
- `POST /api/webhooks/stripe` — Stripe webhook: on payment_intent.succeeded, creates Payment record and marks Class as paid
- `POST /api/revalidate` — cache revalidation endpoint

## Key Route Structure
```
/ — public landing page (Hero + Opinions)
/login — login page
/register — choose role
/register/student — student registration
/register/teacher — teacher registration
/signout — sign out

/main/student/dashboard — upcoming classes + payment history
/main/student/classes — all classes list
/main/student/classes/request — request a new class
/main/student/classes/[id] — class detail
/main/student/classes/[id]/accept|cancel|refuse|pay|pay/success
/main/student/teachers — browse teachers
/main/student/teachers/[id] — teacher profile + ratings

/main/teacher/dashboard — upcoming classes + earnings summary
/main/teacher/classes — all classes list
/main/teacher/classes/request — create class for a student
/main/teacher/classes/[id] — class detail
/main/teacher/classes/[id]/accept|cancel|refuse|pay|pay/success
/main/teacher/students — student list
/main/teacher/earnings — full earnings history with stats

/main/admin/dashboard — stats overview (currently hardcoded placeholder)
/main/admin/teachers — teacher management
/main/admin/teachers/create — create teacher
/main/admin/teachers/[id]/delete — delete teacher
/main/admin/students — student management
/main/admin/classes — class management
/main/admin/subjects — subject list
/main/admin/subjects/create — create subject
/main/admin/payments — payment management
/main/admin/settings — admin settings
```

## Server Actions (app/lib/actions/)
- `classes.actions.ts` — fetch, accept, refuse, cancel classes
- `paymets.actions.ts` (note typo in filename) — fetch payments by student/teacher, createPaymentForClass
- `stripe.ts` — fetchClientSecret (Stripe Checkout session)
- `teachers.actions.ts`, `students.actions.ts`, `users.actions.ts`, `subjects.actions.ts`, `ratings.actions.ts`

## Notes
- Admin dashboard stats are currently hardcoded (placeholder data)
- `app/lib/actions/stripe.ts` still has a `{{PRICE_ID}}` placeholder — payment flow may use PaymentIntent approach via the webhook instead
- `paymets.actions.ts` has a typo in the filename (missing 'y')
- Both student and teacher have mirrored class pages (`/main/student/classes/[id]/*` and `/main/teacher/classes/[id]/*`)

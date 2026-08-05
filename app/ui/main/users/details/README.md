# app/ui/main/users/details

Read-only user-profile display components — the "public-facing detail page"
counterpart to the editable forms one level up in `app/ui/main/users/`.
Composed together on a user detail route (e.g. `/main/users/[id]`) to show
another user's (typically a teacher's) profile, bio, and ratings.

## Key files

- **`header.tsx`** (default export `UserDetailsHeader`) — server component,
  a `card` with the user's avatar (via `getAvatar` from
  `@/utils/get-avatar`), role badge, name, email, bio (if set), and a
  "Member since <month year>" line derived from `createdAt`. Renders
  `TeacherRating` in the top-right **only when `user.role === "teacher"`**
  — students get no rating display. Guards against a missing user with an
  inline `"User not found."` div rather than throwing/redirecting, so the
  parent page controls what "not found" means. Bottom edge has a decorative
  gradient bar (`bg-gradient-to-r from-primary via-accent to-secondary`)
  matching the same treatment in `user-card.tsx`.

- **`teacher-rating.tsx`** — pure presentational, renders a 5-star display
  supporting half-stars: it computes `rounded = Math.round(rating * 2) / 2`
  and layers a `fa-solid fa-star` (colored `text-warning`) on top of a
  `fa-regular fa-star` background per star, clipped to 50% width via
  inline `clipPath: "inset(0 50% 0 0)"` for the half-star case. Shows
  "No ratings yet" in muted italic when `rating === 0`, and an optional
  review count line. This is the compact/inline rating widget used in the
  header; contrast with `review-card.tsx` below which renders one full
  review.

- **`review-card.tsx`** (default export `RatingCard` — note the
  file/export name mismatch) — a single review card: rounds the numeric
  rating to whole stars (no half-star support here, unlike
  `teacher-rating.tsx`) plus a `RATING_LABELS` word (Poor/Fair/Good/Very
  good/Excellent), the review text in quotes (or an italic "No written
  review." placeholder), and a footer with the student's name and a
  formatted date. Takes a full `Rating` object from
  `@/app/lib/types/ratings.types`, so it's meant to be mapped over a list
  of reviews rather than composed from loose props like
  `teacher-rating.tsx` is.

## How it fits together

Both `teacher-rating.tsx` and `review-card.tsx` render 5-star icon rows
independently with slightly different rounding/rendering logic (half-star
clip-path vs. whole-star round) — they are **not** sharing a common star
sub-component. If a future change needs to standardize star rendering
(e.g. to fix a rounding inconsistency), both files need to be touched.

Icons are Font Awesome (`fa-solid`/`fa-regular fa-star`) throughout, per
the app-wide convention — no `react-icons` usage here.

# app/ui/register, app/ui/register/student, app/ui/register/teacher

Registration form components. `app/ui/register/` itself has no files — it's just the parent for the two subdirectories below, split by the same student/teacher asymmetry documented in `app/lib/auth/README.md` and `app/register/README.md`.

## `student/register-student-form.tsx`

`RegisterStudentForm`, mounted by both `app/register/page.tsx` and `app/register/student/page.tsx`. Fields: first/last name, optional phone, email, password + confirm, and a required "I agree to Terms/Privacy" checkbox (links to `/terms-of-service` and `/privacy-policy`, opened in a new tab). No props. Wraps `registerStudent` (`app/lib/auth/register-student.ts`) via `useActionState`. Validation is entirely server-side in the action — this component only sets `required`/`type` HTML attributes.

## `teacher/register-teacher-form.tsx`

`RegisterTeacherForm`, mounted **only** by `app/main/admin/teachers/create/page.tsx` — nothing under `app/register/` uses it (see that directory's README for why: `/register/teacher` is now an informational admin-contact page, not a form). Takes a required `subjects: SubjectData[]` prop, fetched server-side by the admin page via `fetchSubjects()` and passed down — this component does not fetch its own data. Same field set as the student form plus a subject multi-select (`SubjectSelect`, below); wraps `registerTeacher` (`app/lib/auth/register-teacher.ts`), which independently re-checks the caller is an admin regardless of which page rendered this form.

## `teacher/subject-select.tsx`

`SubjectSelect` — a daisyUI dropdown-menu multi-select for the subjects a teacher teaches. Locally controlled (`useState<string[]>`), rendering one checkbox per subject with `name="subjects"` and `value={subject.id}` — because each checkbox is a real DOM input reflecting `checked` from state, native `FormData` submission on the parent `<form>` still collects every checked value under the `subjects` key correctly (`registerTeacher` reads them with `formData.getAll("subjects")`); the component doesn't need to serialize its own selection into a hidden field. Has proper listbox a11y semantics (`role="listbox"`/`role="option"`/`aria-multiselectable`/`aria-selected`) on the dropdown.

## Conventions confirmed here

- No Zod — both forms rely on the server actions for real validation, matching every other form in the auth surface.
- Icons: both use raw inline `<svg>` (error alert icon, dropdown chevron) — consistent with `app/ui/login/*`, not Font Awesome.

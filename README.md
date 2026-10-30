# AR Career Point

Online tests and practice sets for Bihar Board and competitive exams. The Next.js frontend uses the Express API for authentication, test content, server grading, saved attempts, and admin question management. PostgreSQL stores application data through Prisma.

## Requirements

Node.js 22 and PostgreSQL 17 (or a compatible PostgreSQL installation). Install dependencies separately in `backend/` and `frontend/` with `npm ci`.

## Backend setup (PowerShell)

```powershell
cd backend
npm ci
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Edit `.env.local`: set `DATABASE_URL` to your database and `JWT_SECRET` to the generated value. Choose unique `SEED_ADMIN_PASSWORD` and `SEED_STUDENT_PASSWORD` values (at least 12 characters) if you want to seed the local sample accounts. Do not commit `.env.local`.

```powershell
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

The API runs at `http://localhost:5000/api`. `prisma:push` applies the new optional `PracticeSet.testId` relationship. Review the schema changes and back up existing data before applying them to an existing deployment. For production, create and review Prisma migrations instead of using development schema push.

The seed creates `admin@arcareerpoint.com` and `student.demo@arcareerpoint.com` using the passwords you supplied. Re-running the seed updates those accounts' passwords and roles. There are no passwordless demo buttons or built-in account passwords. Public signup always creates a student. The seed includes one science test, one linked online practice set, two practice listings awaiting content, and sample notices. Add real tests/PDF links before advertising other sets as available.

## Frontend setup

In another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000/api`; set it before building a deployment. Set backend `FRONTEND_URL` to the deployed frontend origin. Session tokens are stored in browser session storage and verified by the API; passwords and answer keys are not used for client-side grading. Reloading the dashboard loads saved history from PostgreSQL. Use **View Result** to reopen an earlier answer review.

## Admin access and creating tests

Public registration creates a student account. For the first admin, register your own email through the website, then run this from `backend/` with the correct database environment:

```powershell
npm run admin:promote -- your-email@example.com
```

This operator command promotes an existing account and keeps its existing password. It does not create a public admin-signup route. Open `/admin`, click **Admin sign in**, and use that email and password. An admin login opens the admin panel; a student login opens the student dashboard. A student cannot access admin API routes, even if they edit browser state.

An existing admin can use **User roles** to search registered accounts and grant/revoke admin access. Your own role cannot be changed from this screen. Permissions are checked against the current database role on every authenticated request, and the browser rechecks its account on focus or authorization errors.

To create a test:

1. Enter its title, category, duration, optional passing marks and instructions, then click **Create draft test**.
2. The new draft is selected automatically. Add its questions and select the correct option for each.
3. Click **Publish** in the test list. Drafts and empty tests are hidden from students. Publication checks the question keys and passing marks against the computed total.
4. Unpublish a test before changing questions. Once students have submitted attempts, its questions are locked to preserve saved reviews; create a new draft for a revised paper.

No database schema change is required for these admin features.

## Completed tests and leaderboard

A signed-in student's first visit to a test starts the quiz as before. Selecting a test they have already submitted opens a results dialog: their latest score, pass/fail result, attempt date, time taken and recent history appear on the left, with a student leaderboard on the right. The layout stacks vertically on phones.

Use **View result** to review an owned attempt or **Retry test** to start with fresh answers and a new timer. Results also include a **Leaderboard & your attempts** button. Opening results never creates another attempt. Retry keeps all earlier attempts.

The leaderboard lists the top 20 current student accounts, using one best attempt per student. Scores rank descending; ties use faster completion time, then the earlier attempt, with an internal ID as the final deterministic tie-breaker. Admin and guest attempts are excluded. Your best rank is shown even when it falls outside the top 20. Your latest 10 attempts are included in the dialog; older history remains in the dashboard. Dates use the browser's local time zone.

The authenticated `GET /api/tests/:id/scoreboard` endpoint only returns other student rankings after the caller has attempted that published test. It exposes display names and score summaries, without other users' emails, account IDs, attempt IDs or answers. The normal attempt-detail endpoint retains its ownership checks. Ranking and personal summaries use a single consistent database snapshot. No database schema migration is required.

## Validation

```powershell
cd frontend
npm run lint
npm run build
cd ../backend
npm run build
```

Backend integration tests require a separate local PostgreSQL database whose name contains `test`. Tests reject a non-local database or a non-test environment. They create and remove only their own fixtures.

```powershell
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/ar_career_test?schema=public'
$env:JWT_SECRET = 'a-separate-random-secret-of-at-least-32-characters'
npm run prisma:push
npm test
```

GitHub Actions validates frontend lint/build and backend build/integration tests against a PostgreSQL service.

## Existing deployments and repository history

The previously published JWT secret must be replaced in each deployment's environment; deploying this code with the old value fails deliberately. This invalidates old tokens. Rotate any database credentials that were reused from the previously tracked environment file. The working configuration now lives in ignored `.env.local` files; the legacy tracked `.env` contains only a note. Previously committed secrets remain in Git history until the repository owner removes them separately.

The source distribution excludes `node_modules`, `dist`, `.next`, `.git`, and local environment files. The existing Git checkout still tracks old generated files because automatic approval review blocked the untracking command. The root `.gitignore` prevents new generated files from being added; the repository owner should also untrack the existing dependency/build directories when reviewing the cleanup.

## Scope

These fixes secure the identified access paths and connect the main application flows. The quiz timer is client-side and the API validates the submitted duration; this is a practice platform, without server-managed exam sessions or proctoring. Production hosting, password reset/email verification, and populating the remaining exam content are separate work.

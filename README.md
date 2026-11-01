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

Edit `.env.local`: set `DATABASE_URL` to your database and `JWT_SECRET` to the generated value. Choose unique `SEED_SUPERADMIN_PASSWORD`, `SEED_ADMIN_PASSWORD`, and `SEED_STUDENT_PASSWORD` values (at least 12 characters) if you want to seed the sample accounts. Set `SEED_SUPERADMIN_EMAIL` to the superadmin sign-in email. Do not commit `.env.local`.

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The API runs at `http://localhost:5000/api`. The migration creates the database schema, including the `SUPERADMIN` role. For an existing database that was created with `prisma db push` and has no migration history, back it up, run `npm run prisma:push` to apply the new role, then mark `20261031000000_init` as applied with `node scripts/prisma.cjs migrate resolve --applied 20261031000000_init` before using `migrate deploy` for future releases.

For a fresh production database, build the backend and apply committed migrations with `npm ci`, `npm run prisma:generate`, `npm run prisma:deploy`, and `npm run build`. Then seed the initial superadmin once using the protected deployment environment variables; do not expose seed passwords in source control or build logs.

The seed creates a superadmin (using `SEED_SUPERADMIN_EMAIL`), `admin@arcareerpoint.com`, and `student.demo@arcareerpoint.com` using the passwords you supplied. Re-running the seed updates those accounts' passwords and roles. Sign in with the seeded superadmin account to create, edit, or remove administrator and student accounts. Superadmins can create and edit student/admin accounts and remove them. Regular admins can view the dashboard user list and remove students, as well as manage tests, categories, and questions. Superadmin accounts are protected from these actions. Public signup always creates a student. There are no passwordless demo buttons or built-in account passwords. The seed includes one science test, one linked online practice set, two practice listings awaiting content, and sample notices. Add real tests/PDF links before advertising other sets as available.

## Frontend setup

Public signup uses a unique, case-insensitive username (3–30 letters, digits, or underscores), an email, and a password. Username and email availability are checked while typing, and database unique indexes enforce the final registration. Signin accepts username or email. Existing accounts without usernames continue to use email signin. Email validation checks formatting and duplicate accounts; it does not send verification emails. The target exam selector is no longer part of signup.

Existing installations with migration history should apply the new `20261031000200_usernames` migration with `npm run prisma:deploy` in `backend/`. Databases maintained with `prisma db push` can use `npm run prisma:push` to add the nullable username column and unique index without changing existing accounts. If baselining a database after applying the latest schema with `db push`, mark each committed migration as applied after checking that its schema changes are present.

In another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000/api`; set it before building a deployment. Set backend `FRONTEND_URL` to the deployed frontend origin. Session tokens are stored in browser session storage and verified by the API; passwords and answer keys are not used for client-side grading. Reloading the dashboard loads saved history from PostgreSQL. Use **View Result** to reopen an earlier answer review.

## Performance summaries

After submission, results show rank, score, attempted questions, accuracy, percentile, and a subject summary. Rank compares the selected attempt to each other participant's best score, with faster time breaking score ties. Percentile measures the percentage of participants with a strictly lower score. Retakes do not add duplicate participants. Section scores include negative marking; the overall score retains the grading engine's zero floor.

New attempts record time spent viewing each question and save it with the answer review. Subject time totals add up to the recorded overall duration. Earlier attempts show missing section times as “Not recorded.” Timing is reported by the practice client and is not a proctored exam session. Apply the `20261031000300_question_timing` migration before deploying this version (or `prisma:push` for existing local databases maintained that way).

## Bulk question uploads

In the admin portal, open **Bulk Upload Questions**, select a test, and download the CSV or JSON template. CSV files can be edited in Excel and must be saved as **CSV UTF-8**. Upload a file to preview its questions and validation errors, then click **Import questions**. An upload accepts up to 500 questions and a 2 MB file.

Required columns/JSON keys are `question`, `optionA`, `optionB`, `optionC`, `optionD`, and `correctAnswer` (A, B, C, or D). Optional keys are `subject`, `explanation`, `marks` (default 1), and `negativeMarks` (default 0.25). CSV fields with commas, quotation marks, or newlines must be quoted using standard CSV escaping. Both English and Hindi text are supported. JSON uses an array of these flat question objects, with answer options as strings.

All questions are validated before importing. Identical questions within the file or already in the selected test are rejected. The API appends the questions in file order and updates the selected test's total marks in one transaction. Invalid uploads create no questions. Only admins and superadmins can import. Questions from existing tests are retained.

## Validation

```powershell
cd frontend
npm run lint
npm run build
cd ../backend
npm run build
```

Backend integration tests require a separate local PostgreSQL database whose name contains `test` and credentials with access to it. Tests reject a non-local database or a non-test environment. They create and remove only their own fixtures.

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

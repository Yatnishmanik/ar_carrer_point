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

# Backend

See the repository README for environment setup, seeding, schema updates, and tests.

## Routes

- Public: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/tests`, `GET /api/tests/:id`, `GET /api/exams`, `GET /api/practice`, `GET /api/updates`. Test responses exclude correct-answer flags and explanations.
- Signed-in users: `GET /api/auth/me`, `POST /api/attempts`, `GET /api/attempts/user/:userId`, `GET /api/attempts/:id`. Students can read only their own attempts; submission identity comes from the verified account.
- Admins: read/write the question bank and create/delete tests, create categories, practice listings and notices. Authorization checks the current database role on every request.

Question creation validates exactly one correct option and updates test marks in the same transaction. Used questions cannot be deleted, preserving submitted answer reviews.

## Admin workflow endpoints

- `POST /api/auth/admin/login`: validates credentials and requires the stored ADMIN role; regular login remains available for both account roles.
- `GET /api/tests/admin`: admin-only list including drafts, question counts and attempt counts.
- `POST /api/tests`: creates a private draft. Total marks are computed from saved questions.
- `PATCH /api/tests/:id` with `{ "isPublished": true | false }`: validates and publishes/unpublishes a test.
- `GET /api/users?search=...`: admin-only account search, limited to 50 results with no password hashes.
- `PATCH /api/users/:id/role` with `{ "role": "ADMIN" | "STUDENT" }`: changes another account's role; self changes are rejected.
- `npm run admin:promote -- email@example.com`: operator-only first-admin setup; preserves the existing password.

Question writes and publication use serializable transactions. Published tests cannot change questions, and tests with prior attempts remain locked after unpublishing.

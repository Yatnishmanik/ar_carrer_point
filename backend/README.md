# Backend

See the repository README for environment setup, seeding, schema updates, and tests.

## Routes

- Public: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/tests`, `GET /api/tests/:id`, `GET /api/exams`, `GET /api/practice`, `GET /api/updates`. Test responses exclude correct-answer flags and explanations.
- Signed-in users: `GET /api/auth/me`, `POST /api/attempts`, `GET /api/attempts/user/:userId`, `GET /api/attempts/:id`. Students can read only their own attempts; submission identity comes from the verified account.
- Admins: read/write the question bank and create/delete tests, create categories, practice listings and notices. Authorization checks the current database role on every request.

Question creation validates exactly one correct option and updates test marks in the same transaction. Used questions cannot be deleted, preserving submitted answer reviews.

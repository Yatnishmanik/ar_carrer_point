# AR Career Point - Backend API

Production-ready backend API service for the **AR Career Point** Online Test Platform.

Built with **Node.js**, **Express.js**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## 🚀 Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript 5.7+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma Client & Prisma CLI
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Execution**: `tsx` for high-speed hot-reload development, `tsc` for production builds

---

## 📁 Project Structure

```text
backend/
├── prisma/
│   ├── schema.prisma        # Complete PostgreSQL relational data models
│   └── seed.ts              # Seeder with default tests, questions, and users
├── src/
│   ├── config/              # Centralized environment configurations
│   ├── controllers/         # Business logic handlers
│   │   ├── attempt.controller.ts   # Test submissions & grading calculation
│   │   ├── auth.controller.ts      # Student/Admin login & registration
│   │   ├── exam.controller.ts      # Exam categories
│   │   ├── practice.controller.ts  # Practice sets & PDF papers
│   │   ├── question.controller.ts  # Question bank management
│   │   ├── test.controller.ts      # Tests retrieval & management
│   │   └── update.controller.ts    # Board announcements & notices
│   ├── lib/
│   │   └── prisma.ts        # Singleton Prisma client instance
│   ├── middlewares/
│   │   ├── auth.ts          # JWT authentication & Admin role guards
│   │   └── errorHandler.ts  # Global error & Prisma exception handler
│   ├── routes/              # Modular Express route collections
│   │   ├── attempt.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── exam.routes.ts
│   │   ├── index.ts         # Master router (/api)
│   │   ├── practice.routes.ts
│   │   ├── question.routes.ts
│   │   ├── test.routes.ts
│   │   └── update.routes.ts
│   ├── utils/
│   │   ├── grading.ts       # Accurate auto-grading engine
│   │   └── jwt.ts           # Token sign & verify
│   └── server.ts            # Express server entrypoint
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database server running

### 2. Environment Configuration
Verify your `backend/.env` file has the correct PostgreSQL credentials:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ar_career_point?schema=public"
JWT_SECRET="ar_career_point_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"
```

### 3. Initialize Database Schema
Push the Prisma schema to your PostgreSQL database:

```bash
npm run prisma:push
```
*(Or run `npm run prisma:migrate` for formal SQL migration files).*

### 4. Seed Initial Data
Populate the database with realistic Hindi/English questions, categories, and test users:

```bash
npm run prisma:seed
```

This creates:
- **Admin Account**: `admin@arcareerpoint.com` / `adminpassword123`
- **Student Account**: `student.demo@arcareerpoint.com` / `studentpassword123`
- 6 Exam categories (Bihar Board 10th & 12th, Railway, SSC, BPSC)
- Full Bihar Board 10th Science Mock Test with 8 questions & explanations
- Practice sets & live notices

### 5. Start Development Server

```bash
npm run dev
```

The server will listen at `http://localhost:5000`.

---

## 📖 API Documentation & Endpoints

Base URL: `http://localhost:5000/api`

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student | Public |
| `POST` | `/api/auth/login` | Login user & get JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user | Bearer Token |

### 2. Tests & Mock Quizzes (`/api/tests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tests` | Query all tests (supports `?category=` & `?search=`) | Public |
| `GET` | `/api/tests/:id` | Get test questions and options | Public |
| `POST` | `/api/tests` | Create a new test | Admin Only |
| `DELETE` | `/api/tests/:id` | Delete a test | Admin Only |

### 3. Exam Categories (`/api/exams`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/exams` | Query all exam categories | Public |
| `POST` | `/api/exams` | Add exam category | Admin Only |

### 4. Test Submission & Grading (`/api/attempts`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/attempts` | Submit test attempt for instant auto-grading | Public / Student |
| `GET` | `/api/attempts/user/:userId` | Student test attempt history | Public / Student |
| `GET` | `/api/attempts/:id` | Full test attempt review with answer explanations | Public / Student |

#### Submission Payload Example (`POST /api/attempts`):
```json
{
  "testId": "test-bseb-10-sci",
  "userId": "usr-optional-id",
  "timeSpentSeconds": 185,
  "answers": [
    { "questionId": "q1", "selectedOptionId": "opt2" },
    { "questionId": "q2", "selectedOptionId": "opt1" }
  ]
}
```

### 5. Question Bank Management (`/api/questions`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/questions` | View all questions | Public / Admin |
| `POST` | `/api/questions` | Create question with 4 options and answer | Admin Only |
| `DELETE` | `/api/questions/:id` | Remove question from bank | Admin Only |

### 6. Practice Sets & Notice Board
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/practice` | List practice sets & downloadable PDFs |
| `GET` | `/api/updates` | List live exam notice board items |
| `GET` | `/api/health` | Service health status |

---

## 🧪 Production Build & Run

```bash
# Compile TypeScript to dist/
npm run build

# Start production server
npm start
```

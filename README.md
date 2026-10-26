# AR Career Point - Online Test Platform

A full-stack educational online test, practice set, and examination portal for Bihar Board (Class 10th & 12th), Railway NTPC, SSC GD, and BPSC.

---

## 🏗️ Architecture

```text
ar-career-point/
├── frontend/    # Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons
└── backend/     # Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM
```

---

## ⚡ Quick Start

### 1. Backend Setup (Node.js + PostgreSQL + Prisma)

```powershell
# Navigate to backend directory
cd backend

# Install dependencies (already installed)
npm install

# Update your PostgreSQL connection string in .env if needed:
# DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ar_career_point?schema=public"

# Push schema to your PostgreSQL database
npm run prisma:push

# Seed default mock tests, questions, and test accounts
npm run prisma:seed

# Start the backend server on http://localhost:5000
npm run dev
```

### 2. Frontend Setup (Next.js 16 + React 19)

Open a second terminal window:

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Start the frontend development server on http://localhost:3000
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Accounts (Pre-configured in Seeder)

| Role | Email | Password |
|---|---|---|
| **Admin Officer** | `admin@arcareerpoint.com` | `adminpassword123` |
| **Demo Student** | `student.demo@arcareerpoint.com` | `studentpassword123` |

You can also use the one-click **"Demo Student"** or **"Demo Admin"** buttons directly in the frontend UI.

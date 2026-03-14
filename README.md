# SAMS — Student Affair Management System

> **University of Eastern Africa, Baraton (UEAB)**  
> A unified institutional management platform integrating finance, work-study, and student governance into one cohesive ecosystem.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Features & Modules](#4-features--modules)
   - [Authentication & Authorization](#41-authentication--authorization)
   - [Chapa360 — Finance Module](#42-chapa360--finance-module)
   - [SWSMS — Work Study Module](#43-swsms--work-study-module)
   - [SGMS — Governance Module](#44-sgms--governance-module)
   - [Analytics Dashboard](#45-analytics-dashboard)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Database Schema and Connection](#6-database-schema-and-connection)
   - [Database Connection Setup](#61-database-connection-setup)
   - [How Drizzle ORM Connects to Each Table](#62-how-drizzle-orm-connects-to-each-table)
   - [Foreign Key Constraints](#63-foreign-key-constraints)
   - [Table-to-Route Mapping](#64-table-to-route-mapping)
7. [API Reference](#7-api-reference)
8. [Frontend Routing](#8-frontend-routing)
9. [User Workflows](#9-user-workflows)
10. [Installation & Setup](#10-installation--setup)
11. [Environment Configuration](#11-environment-configuration)
12. [Running the Application](#12-running-the-application)
13. [Database Management](#13-database-management)
14. [Design System](#14-design-system)
15. [Project Structure](#15-project-structure)
16. [Security](#16-security)
17. [Future Roadmap](#17-future-roadmap)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project Overview

**SAMS (Student Affair Management System)** is a comprehensive, full-stack web application built for the University of Eastern Africa, Baraton. It brings together three historically separate administrative processes under a single, unified interface:

| Module | Full Name | Purpose |
|--------|-----------|---------|
| **Chapa360** | Digital Finance & Payment Management | Manages student virtual accounts, balances, and transaction history |
| **SWSMS** | Student Work Study Management System | Handles work-study applications, timecards, supervision, and payment tracking |
| **SGMS** | Student Governance Management System | Runs elections, manages candidates, records votes, and handles leadership handovers |

The system is designed for institutional use, supporting five distinct user roles — students, administrators, supervisors, treasurers, and the Vice Chancellor — with role-based access control enforced on both the frontend and backend.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER CLIENT                      │
│                                                          │
│  React 18 + TypeScript  (Vite Dev Server / Static)      │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  Wouter  │  │ TanStack Query│  │  Zustand (Auth)  │  │
│  │ (Router) │  │ (Server State)│  │  (Client State)  │  │
│  └──────────┘  └───────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │   Shadcn/UI + Radix UI + Tailwind CSS            │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP / REST (Bearer JWT)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS.JS SERVER (Port 5000)          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Auth Middleware  │  Role-Based Access Control   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  REST API Routes (routes.ts)                     │   │
│  │  /api/auth/*  /api/chapa360/*  /api/swsms/*      │   │
│  │  /api/sgms/*  /api/admin/*     /api/analytics/*  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Drizzle ORM  (Type-safe Query Builder)          │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │  SQL (Neon Serverless)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 POSTGRESQL (Neon Serverless)              │
│                                                          │
│  users │ accounts │ transactions │ workApplications      │
│  timecards │ payments │ elections │ candidates           │
│  votes │ handovers                                       │
└─────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. User interacts with the React frontend.
2. TanStack Query fires a fetch request with the `Authorization: Bearer <JWT>` header.
3. Express receives the request and runs `authMiddleware` to validate the JWT.
4. If the token is valid and not blacklisted, `requireRole()` middleware checks permissions.
5. The route handler queries PostgreSQL via Drizzle ORM and returns a JSON response.
6. TanStack Query caches the response and updates the UI.

---

## 3. Technology Stack

### Frontend

| Technology | Version | Role |
|-----------|---------|------|
| **React** | 18.3.x | UI library |
| **TypeScript** | 5.6.x | Type safety |
| **Wouter** | 3.3.x | Lightweight client-side router |
| **TanStack Query** | 5.60.x | Server state management & caching |
| **Zustand** | 5.0.x | Global auth state (persisted to localStorage) |
| **Tailwind CSS** | 3.4.x | Utility-first styling with UEAB custom theme |
| **Shadcn/UI** | — | Pre-built, accessible component library |
| **Radix UI** | — | Headless, accessible UI primitives |
| **Lucide React** | 0.453.x | Icon library |
| **React Hook Form** | 7.55.x | Form state management |
| **Zod** | 3.24.x | Schema validation (client-side) |
| **Recharts** | 2.15.x | Data visualization & charts |
| **Framer Motion** | 11.13.x | Animations and transitions |
| **Vite** | 5.4.x | Build tool and dev server |

### Backend

| Technology | Version | Role |
|-----------|---------|------|
| **Express.js** | 4.21.x | HTTP server framework |
| **TypeScript** | 5.6.x | Type safety |
| **Drizzle ORM** | 0.39.x | Type-safe database abstraction |
| **@neondatabase/serverless** | 0.10.x | Neon PostgreSQL connection |
| **jsonwebtoken** | 9.0.x | JWT generation and verification |
| **bcryptjs** | 3.0.x | Password hashing (salt rounds: 10) |
| **Zod** | 3.24.x | Runtime request validation |
| **dotenv** | 17.x | Environment variable loading |
| **TSX** | 4.20.x | TypeScript executor for Node.js |
| **ESBuild** | 0.25.x | Production bundler for server |

### Database & Infrastructure

| Technology | Role |
|-----------|------|
| **PostgreSQL** (via Neon) | Primary database (serverless) |
| **Drizzle Kit** | Schema migration management |

---

## 4. Features & Modules

### 4.1 Authentication & Authorization

SAMS uses a **JWT-based (JSON Web Token) authentication system**.

#### How It Works

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│  Client  │  POST   │    Server    │  Query  │    DB    │
│          │────────▶│ /auth/login  │────────▶│  users   │
│          │         │              │◀────────│          │
│          │◀────────│  JWT Token   │         │          │
│          │         │              │         │          │
│  Store   │  GET    │ /auth/session│         │          │
│  Token   │────────▶│ (validate)   │         │          │
│ (Zustand)│◀────────│  user object │         │          │
└──────────┘         └──────────────┘         └──────────┘
```

1. **Registration** — `POST /api/auth/register`
   - Creates a new user with `role: "student"` (hard-coded; privilege escalation is prevented)
   - Hashes the password with bcrypt (10 salt rounds)
   - Automatically creates a linked Chapa360 financial account
   - Returns a JWT token immediately

2. **Login** — `POST /api/auth/login`
   - Validates email and bcrypt-compares the password
   - Returns a JWT token (expires in **7 days**)

3. **Session Validation** — `GET /api/auth/session`
   - Used on app startup to validate a stored token
   - Returns the current user object if the token is valid

4. **Logout** — `POST /api/auth/logout`
   - Adds the current token to an **in-memory blacklist** (a `Set<string>` on the server)
   - Any subsequent request with the blacklisted token receives `401 Unauthorized`

#### Token Structure

```json
{
  "id": "uuid-v4",
  "email": "student@ueab.ac.ke",
  "role": "student",
  "iat": 1712345678,
  "exp": 1712950478
}
```

#### Security Notes

- Passwords are **never stored in plain text** — bcrypt with 10 rounds is used
- JWTs are signed with a secret key (`JWT_SECRET` env var); the server throws if it is missing
- The token blacklist lives **in memory** — it resets on server restart (tokens re-validated from `exp`)
- Admin/supervisor/treasurer/vc accounts must be **manually created** in the database; self-registration always creates `student` role only

---

### 4.2 Chapa360 — Finance Module

Chapa360 is the virtual financial management system for student accounts.

#### What It Does

- Each student gets a **unique virtual account** (account number format: `UEAB` + 8-digit timestamp suffix) created automatically at registration
- Tracks **credits** (money in) and **debits** (money out) as a ledger
- Provides real-time **balance** calculation
- Admins and treasurers can view **all student accounts** across the institution

#### Data Flow

```
Student Registers
       │
       ▼
Account Created (balance: 0.00, accountNumber: UEAB########)
       │
       ▼
Transactions Added (credit / debit entries)
       │
       ▼
Balance = Σ credits − Σ debits (computed by DB query)
```

#### Account Page (`/chapa360/account`)

Displays:
- Current balance
- Total lifetime credits
- Total lifetime debits
- Total transaction count
- 5 most recent transactions

#### Transactions Page (`/chapa360/transactions`)

Displays:
- Full transaction history in descending date order
- Filter by type: **All**, **Credits**, **Debits**
- Each entry shows: amount, type, category, description, status, and date

#### Transaction Fields

| Field | Type | Values |
|-------|------|--------|
| `amount` | decimal (10,2) | Positive number |
| `type` | enum | `credit`, `debit` |
| `category` | text | e.g., "Work-Study Payment", "Fee Payment" |
| `description` | text | Human-readable description |
| `status` | enum | `pending`, `completed`, `failed` |

---

### 4.3 SWSMS — Work Study Module

SWSMS manages the full lifecycle of a student's work-study participation.

#### Process Overview

```
Student Submits Application
           │
           ▼
  Status: "pending"
           │
     Admin Reviews
      ┌────┴────┐
   Approved   Rejected
      │            │
      ▼            ▼
Student Logs     Application
  Timecards       Closed
      │
      ▼
Timecard Status: "pending"
      │
Admin/Supervisor Verifies
  ┌───┴───┐
Verified  Rejected
      │
      ▼
Payment Processed
```

#### Student Workflow

**Applications** (`/swsms/applications`)
- Submit a new application with:
  - Department name
  - Position/job title
  - Desired hours per week
  - Reason for applying
- View all previous applications with current status and review notes

**Timecards** (`/swsms/timecards`)
- Log work hours for an **approved** application only
- Each timecard entry includes:
  - Date worked
  - Hours worked (decimal, e.g., 3.5)
  - Task description
  - Auto-generated QR code for supervisor scanning
- View all submitted timecards with verification status

#### Admin/Supervisor Workflow

**Vetting Dashboard** (`/admin/swsms/vetting`)
- View all pending, approved, and rejected applications
- Approve or reject with optional review notes
- See applicant details (name, university ID, department, position)

**Timecard Management** (`/admin/swsms/timecards`)
- View all submitted timecards from all students
- Verify or reject individual timecard entries
- See associated student and application details

#### Work Application Fields

| Field | Type | Description |
|-------|------|-------------|
| `department` | text | Department the student applies to |
| `position` | text | Job/role title |
| `hoursPerWeek` | integer | Requested hours (1–40) |
| `reason` | text | Motivation/justification |
| `status` | enum | `pending`, `approved`, `rejected` |
| `reviewedBy` | UUID (FK) | Admin/supervisor who reviewed |
| `reviewNotes` | text | Feedback from reviewer |

#### Timecard Fields

| Field | Type | Description |
|-------|------|-------------|
| `applicationId` | UUID (FK) | Linked approved application |
| `date` | timestamp | Date of work |
| `hoursWorked` | decimal (4,2) | Hours on that day |
| `taskDescription` | text | Work performed |
| `qrCode` | text | Auto-generated code for verification |
| `status` | enum | `pending`, `verified`, `rejected` |
| `verifiedBy` | UUID (FK) | Supervisor who verified |

---

### 4.4 SGMS — Governance Module

SGMS handles all aspects of student government — from elections to leadership transitions.

#### Elections

**Student View** (`/sgms/elections`)
- Browse all elections (upcoming, active, completed)
- See candidates for each position with their manifestos
- Cast a vote in **active** elections (one vote per election per student)
- View live vote counts and percentages

**Admin/VC View** (`/admin/sgms/elections`)
- Create new elections with title, description, start date, end date
- View election statistics (candidate count, total votes)

#### Voting Rules

- One student can vote **only once per election** — enforced at the database level
- Votes are linked to the voter ID for tracking but elections support anonymity in display
- Vote percentages are computed dynamically: `(candidate_votes / total_election_votes) × 100`

#### Leadership Handovers

**Handover Page** (`/sgms/handovers`)
- Outgoing leaders create a **handover document** with:
  - Position being handed over
  - Incoming leader (optional at creation)
  - Document URL (e.g., link to Google Drive document)
  - Transition notes
- Mark a handover as **completed** to close it

#### Election Fields

| Field | Type | Values |
|-------|------|--------|
| `title` | text | e.g., "Student Body President 2024" |
| `description` | text | Election description |
| `startDate` | timestamp | When voting opens |
| `endDate` | timestamp | When voting closes |
| `status` | enum | `upcoming`, `active`, `completed` |

#### Candidate Fields

| Field | Type | Description |
|-------|------|-------------|
| `electionId` | UUID (FK) | Parent election |
| `userId` | UUID (FK) | Candidate's user account |
| `position` | text | Position running for |
| `manifesto` | text | Campaign statement |
| `status` | enum | `pending`, `approved`, `rejected` |

---

### 4.5 Analytics Dashboard

SAMS provides analytics at two levels:

**Main Dashboard** (`/dashboard`)
- Role-based quick stats and KPI cards
- Shortcut links to frequent actions
- Overview of pending items (applications, timecards, elections)

**Analytics Page** (`/analytics`)
- **Financial Trends** — Line chart showing monthly balance progression
- **Work-Study Metrics** — Bar chart showing weekly hours worked
- **Governance Participation** — Bar chart showing candidates and votes per election
- Summary cards with trend indicators

> **Note:** The analytics API currently returns illustrative static data for visualization purposes. Future versions will aggregate live data from all three modules.

---

## 5. User Roles & Permissions

SAMS enforces **five distinct roles**. Each role unlocks specific parts of the application.

### Permission Matrix

| Action | Student | Supervisor | Treasurer | Admin | VC |
|--------|:-------:|:----------:|:---------:|:-----:|:--:|
| View own account balance | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own transactions | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all student accounts | ❌ | ❌ | ✅ | ✅ | ❌ |
| Submit work application | ✅ | ✅ | ✅ | ✅ | ✅ |
| Log timecards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve/reject applications | ❌ | ✅ | ✅ | ✅ | ❌ |
| Verify timecards | ❌ | ✅ | ✅ | ✅ | ❌ |
| View all applications (admin) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Vote in elections | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create elections | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage elections (admin view) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create handover documents | ✅ | ✅ | ✅ | ✅ | ✅ |

### Role Assignment

- **Self-registration** always creates a `student` account regardless of input
- Privileged roles (`admin`, `supervisor`, `treasurer`, `vc`) must be assigned by directly updating the `role` column in the `users` database table

---

## 6. Database Schema and Connection

SAMS uses **10 PostgreSQL tables** managed by Drizzle ORM. All primary keys are `UUID` generated by PostgreSQL's `gen_random_uuid()`.

---

### 6.1 Database Connection Setup

The database connection is established in **`server/db.ts`** using three layers:

```
┌──────────────────────────────────────────────────────────────┐
│  server/db.ts                                                │
│                                                              │
│  1. neonConfig.webSocketConstructor = ws                     │
│     └─ Tells the Neon driver to use the Node.js `ws`         │
│        library as the WebSocket transport. Neon's serverless │
│        PostgreSQL uses WebSocket instead of raw TCP.         │
│                                                              │
│  2. pool = new Pool({ connectionString: DATABASE_URL })      │
│     └─ Creates a connection pool from the DATABASE_URL env   │
│        variable. The pool manages multiple concurrent DB     │
│        connections automatically.                            │
│                                                              │
│  3. db = drizzle({ client: pool, schema })                   │
│     └─ Wraps the pool with Drizzle ORM. The `schema` object  │
│        (imported from shared/schema.ts) tells Drizzle about  │
│        every table, so queries are fully type-safe.          │
│                                                              │
│  Exports: pool (raw), db (Drizzle ORM instance)             │
└──────────────────────────────────────────────────────────────┘
```

**Full source of `server/db.ts`:**

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Step 1: Use the Node.js `ws` package as the WebSocket implementation
// Required because Neon communicates over WebSocket, not TCP
neonConfig.webSocketConstructor = ws;

// Step 2: Guard — server will not start without a valid DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Step 3: Create a connection pool using the Neon serverless driver
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Step 4: Create the Drizzle ORM instance, binding pool + schema together
// `schema` contains every table definition (users, accounts, timecards, …)
export const db = drizzle({ client: pool, schema });
```

**Key points:**

| Component | Package | Purpose |
|-----------|---------|---------|
| `Pool` | `@neondatabase/serverless` | Manages a pool of serverless PostgreSQL connections |
| `neonConfig.webSocketConstructor` | `@neondatabase/serverless` | Injects Node.js WebSocket support (required outside browsers) |
| `drizzle()` | `drizzle-orm/neon-serverless` | Creates a type-safe ORM client over the pool |
| `schema` | `@shared/schema` | All 10 table definitions — binds TypeScript types to SQL tables |

**Flow from `.env` to a live query:**

```
.env: DATABASE_URL=postgresql://user:pass@host/db
        │
        ▼
Pool({ connectionString })   ← opens & pools WebSocket connections to Neon
        │
        ▼
drizzle({ client: pool, schema })   ← wraps pool; knows about all 10 tables
        │
        ▼
import { db } from "./db"   ← imported in routes.ts
        │
        ▼
db.select().from(users).where(eq(users.id, id))   ← type-safe SQL query
```

---

### 6.2 How Drizzle ORM Connects to Each Table

Every database table is declared in **`shared/schema.ts`** using Drizzle's `pgTable()` helper. When `server/db.ts` passes this schema to `drizzle()`, Drizzle learns the name and column types of every table and can generate correct SQL for any query against them.

#### Schema Declaration Pattern

Each table follows this structure in `shared/schema.ts`:

```typescript
// 1. Import helpers
import { pgTable, text, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// userRoles is a const tuple defined at the top of shared/schema.ts
// (shown here for context — not part of the pgTable() call itself):
//   export const userRoles = ["student", "admin", "supervisor", "treasurer", "vc"] as const;

// 2. Declare the table — this is the Drizzle "table object"
export const users = pgTable("users", {
  id:           varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email:        text("email").notNull().unique(),
  password:     text("password").notNull(),
  fullName:     text("full_name").notNull(),
  universityId: text("university_id").unique(),
  role:         text("role", { enum: userRoles }).notNull().default("student"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// 3. Declare relations (used by Drizzle for type inference with joins)
export const usersRelations = relations(users, ({ one, many }) => ({
  account:          one(accounts, { fields: [users.id], references: [accounts.userId] }),
  workApplications: many(workApplications),
  timecards:        many(timecards),
  candidacies:      many(candidates),
  handovers:        many(handovers),
}));

// 4. Export TypeScript types inferred from the schema
export type User       = typeof users.$inferSelect;   // shape of a row read from DB
export type InsertUser = z.infer<typeof insertUserSchema>; // shape of data for inserts
```

#### All 10 Table Objects Exported from `shared/schema.ts`

| Drizzle Table Object | SQL Table Name | Module |
|---------------------|----------------|--------|
| `users` | `users` | Auth / shared |
| `accounts` | `accounts` | Chapa360 |
| `transactions` | `transactions` | Chapa360 |
| `workApplications` | `work_applications` | SWSMS |
| `timecards` | `timecards` | SWSMS |
| `payments` | `payments` | SWSMS |
| `elections` | `elections` | SGMS |
| `candidates` | `candidates` | SGMS |
| `votes` | `votes` | SGMS |
| `handovers` | `handovers` | SGMS |

#### How Routes Use the `db` Object

`server/routes.ts` imports `db` and the table objects, then builds type-safe queries:

```typescript
import { db } from "./db";
import { users, accounts, transactions, workApplications, … } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// SELECT — read a user by ID
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, req.user!.id))
  .limit(1);

// INSERT — create a new work application
const [application] = await db
  .insert(workApplications)
  .values({ ...data, userId: req.user!.id })
  .returning();

// UPDATE — approve a timecard
const [updated] = await db
  .update(timecards)
  .set({ status, verifiedBy: req.user!.id })
  .where(eq(timecards.id, id))
  .returning();

// JOIN — fetch timecards with their parent application
const cards = await db
  .select({ timecard: timecards, application: workApplications })
  .from(timecards)
  .leftJoin(workApplications, eq(timecards.applicationId, workApplications.id))
  .where(eq(timecards.userId, req.user!.id));
```

Drizzle translates each of these into parameterised SQL and executes it against the Neon connection pool. The TypeScript types of the result objects are automatically inferred from the schema, so a typo in a column name is a compile-time error.

---

### 6.3 Foreign Key Constraints

Every foreign key in SAMS is defined in `shared/schema.ts` with `.references()` and enforced by PostgreSQL. The constraints are applied by the initial migration (`migrations/0000_nappy_mantis.sql`).

#### Complete Foreign Key Map

```
                                              ┌──────────────────┐
                                              │  transactions    │
                                              │ (account_id FK) ─┼──────────┐
                                              └──────────────────┘          │
                                                                             ▼
┌──────────────┐          ┌──────────┐   CASCADE                   ┌──────────────┐
│  accounts    │          │  users   │◄────────────────────────────│  accounts    │
│ (user_id FK)─┼─CASCADE─▶│ (id PK)  │   (accounts.user_id)        │  (id PK)     │
└──────────────┘          └──────────┘                             └──────────────┘

Simplified arrow convention used below:
  [child table]  ──FK──▶  [parent table]  (ON DELETE behaviour)
```

```
┌──────────────────┐   user_id ──CASCADE──▶  ┌──────────┐
│  accounts        │                          │  users   │
└────────┬─────────┘                          │ (id PK)  │
         │                                    │          │◄── work_applications.user_id (CASCADE)
┌────────▼─────────┐   account_id ─CASCADE──▶ │          │◄── work_applications.reviewed_by (NO ACTION)
│  transactions    │   ┌──────────────────┐   │          │◄── timecards.user_id (CASCADE)
└──────────────────┘   │  work_           │   │          │◄── timecards.verified_by (NO ACTION)
                       │  applications    │   │          │◄── candidates.user_id (CASCADE)
┌──────────────────┐   │ (user_id FK)     │   │          │◄── votes.voter_id (CASCADE)
│  timecards       │──▶│                  │   │          │◄── handovers.from_user_id (NO ACTION)
│(application_id   │   └────────┬─────────┘   │          │◄── handovers.to_user_id (NO ACTION)
│  FK) ─CASCADE──▶ │            │             └──────────┘
│(user_id FK)──────┼───CASCADE──┘
│(verified_by FK)  │   CASCADE
└──────────────────┘
                       ┌──────────────────┐   application_id ─CASCADE──▶ work_applications
                       │  payments        │
                       │(application_id   │
                       │  FK) ─CASCADE──▶ │
                       └──────────────────┘

┌──────────────┐   election_id ─CASCADE──▶  ┌────────────┐
│  candidates  │                             │  elections │
│(user_id FK)──┼──CASCADE──▶ users           │  (id PK)   │◄── votes.election_id (CASCADE)
└──────┬───────┘                             └────────────┘
       │
       │ candidate_id ─CASCADE──▶ ┌──────────┐
       └─────────────────────────▶│  votes   │◄── votes.voter_id ─CASCADE──▶ users
                                  └──────────┘

┌──────────────┐   from_user_id ─NO ACTION──▶ users
│  handovers   │
│  to_user_id ─┼──NO ACTION──▶ users
└──────────────┘
```

#### Foreign Key Reference Table

| Child Table | Child Column | Parent Table | Parent Column | On Delete |
|-------------|-------------|--------------|---------------|-----------|
| `accounts` | `user_id` | `users` | `id` | **CASCADE** |
| `transactions` | `account_id` | `accounts` | `id` | **CASCADE** |
| `work_applications` | `user_id` | `users` | `id` | **CASCADE** |
| `work_applications` | `reviewed_by` | `users` | `id` | NO ACTION |
| `timecards` | `application_id` | `work_applications` | `id` | **CASCADE** |
| `timecards` | `user_id` | `users` | `id` | **CASCADE** |
| `timecards` | `verified_by` | `users` | `id` | NO ACTION |
| `payments` | `application_id` | `work_applications` | `id` | **CASCADE** |
| `candidates` | `election_id` | `elections` | `id` | **CASCADE** |
| `candidates` | `user_id` | `users` | `id` | **CASCADE** |
| `votes` | `election_id` | `elections` | `id` | **CASCADE** |
| `votes` | `candidate_id` | `candidates` | `id` | **CASCADE** |
| `votes` | `voter_id` | `users` | `id` | **CASCADE** |
| `handovers` | `from_user_id` | `users` | `id` | NO ACTION |
| `handovers` | `to_user_id` | `users` | `id` | NO ACTION |

**CASCADE** means: when the parent row is deleted, all child rows are automatically deleted too.  
**NO ACTION** means: if any child row references the parent, deleting the parent raises a PostgreSQL foreign-key violation error. The column being nullable only means the field is optional at INSERT time — once a value is set, the referential integrity is still enforced by PostgreSQL until the child row is updated or deleted first.

---

### 6.4 Table-to-Route Mapping

The table below shows exactly which API routes read from (`SELECT`) or write to (`INSERT`/`UPDATE`) each database table.

| Table | API Route(s) | Operation | Role Required |
|-------|-------------|-----------|---------------|
| `users` | `POST /api/auth/register` | INSERT | Public |
| `users` | `POST /api/auth/login` | SELECT | Public |
| `users` | `GET /api/auth/session` | SELECT | Any auth |
| `accounts` | `POST /api/auth/register` | INSERT (auto) | Public |
| `accounts` | `GET /api/chapa360/account` | SELECT | Any auth |
| `accounts` | `GET /api/admin/chapa360/accounts` | SELECT + JOIN users | admin, treasurer |
| `transactions` | `GET /api/chapa360/account` | SELECT (last 5) | Any auth |
| `transactions` | `GET /api/chapa360/transactions` | SELECT (filtered) | Any auth |
| `work_applications` | `GET /api/swsms/applications` | SELECT | Any auth |
| `work_applications` | `POST /api/swsms/applications` | INSERT | Any auth |
| `work_applications` | `GET /api/admin/swsms/applications` | SELECT + JOIN users | admin, supervisor, treasurer |
| `work_applications` | `PATCH /api/swsms/applications/:id/review` | UPDATE | admin, supervisor, treasurer |
| `timecards` | `GET /api/swsms/timecards` | SELECT + JOIN work_applications | Any auth |
| `timecards` | `POST /api/swsms/timecards` | INSERT | Any auth |
| `timecards` | `GET /api/admin/swsms/timecards` | SELECT + JOIN users + JOIN work_applications | admin, supervisor, treasurer |
| `timecards` | `PATCH /api/swsms/timecards/:id/verify` | UPDATE | admin, supervisor, treasurer |
| `elections` | `GET /api/sgms/elections` | SELECT | Any auth |
| `elections` | `POST /api/sgms/elections` | INSERT | admin, vc |
| `elections` | `GET /api/admin/sgms/elections` | SELECT + COUNT candidates + COUNT votes | admin, vc |
| `candidates` | `GET /api/sgms/elections` | SELECT + JOIN users | Any auth |
| `candidates` | `GET /api/admin/sgms/elections` | COUNT | admin, vc |
| `votes` | `GET /api/sgms/elections` | COUNT per candidate, check hasVoted | Any auth |
| `votes` | `POST /api/sgms/vote` | SELECT (duplicate check) + INSERT | Any auth |
| `votes` | `GET /api/admin/sgms/elections` | COUNT | admin, vc |
| `handovers` | `GET /api/sgms/handovers` | SELECT + JOIN users | Any auth |
| `handovers` | `POST /api/sgms/handovers` | INSERT | Any auth |
| `handovers` | `PATCH /api/sgms/handovers/:id/complete` | UPDATE | Any auth |

---

### Entity Relationship Overview

```
users ──────────── accounts ────── transactions
  │                    
  ├──── workApplications ──── timecards
  │              └──────────── payments
  │
  ├──── candidates ──── elections ──── votes
  │
  └──── handovers (from_user_id / to_user_id)
```

### Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK, default `gen_random_uuid()` | Unique user identifier |
| `email` | text | NOT NULL, UNIQUE | Login email |
| `password` | text | NOT NULL | bcrypt-hashed password |
| `full_name` | text | NOT NULL | Display name |
| `university_id` | text | UNIQUE, nullable | UEAB student/staff ID |
| `role` | text enum | NOT NULL, default `student` | One of: `student`, `admin`, `supervisor`, `treasurer`, `vc` |
| `created_at` | timestamp | NOT NULL, default `NOW()` | Account creation time |

### Table: `accounts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Account identifier |
| `user_id` | varchar (UUID) | FK → users.id (CASCADE) | Owning user |
| `balance` | decimal (10,2) | NOT NULL, default `0.00` | Current balance |
| `account_number` | text | NOT NULL, UNIQUE | Format: `UEAB########` |
| `created_at` | timestamp | NOT NULL, default `NOW()` | Account creation time |

### Table: `transactions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Transaction identifier |
| `account_id` | varchar (UUID) | FK → accounts.id (CASCADE) | Parent account |
| `amount` | decimal (10,2) | NOT NULL | Transaction amount |
| `type` | text enum | NOT NULL | `credit` or `debit` |
| `category` | text | NOT NULL | Transaction category label |
| `description` | text | NOT NULL | Human-readable detail |
| `status` | text enum | NOT NULL, default `completed` | `pending`, `completed`, `failed` |
| `created_at` | timestamp | NOT NULL, default `NOW()` | Transaction timestamp |

### Table: `work_applications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Application identifier |
| `user_id` | varchar (UUID) | FK → users.id (CASCADE) | Applicant |
| `department` | text | NOT NULL | Target department |
| `position` | text | NOT NULL | Job title |
| `hours_per_week` | integer | NOT NULL | Requested work hours |
| `reason` | text | NOT NULL | Application motivation |
| `status` | text enum | NOT NULL, default `pending` | `pending`, `approved`, `rejected` |
| `reviewed_by` | varchar (UUID) | FK → users.id, nullable | Reviewer |
| `review_notes` | text | nullable | Admin feedback |
| `created_at` | timestamp | NOT NULL | Submission time |
| `updated_at` | timestamp | NOT NULL | Last update time |

### Table: `timecards`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Timecard identifier |
| `application_id` | varchar (UUID) | FK → work_applications.id (CASCADE) | Parent application |
| `user_id` | varchar (UUID) | FK → users.id (CASCADE) | Student |
| `date` | timestamp | NOT NULL | Work date |
| `hours_worked` | decimal (4,2) | NOT NULL | Hours on this day |
| `task_description` | text | NOT NULL | Work performed |
| `qr_code` | text | nullable | Auto-generated QR code |
| `verified_by` | varchar (UUID) | FK → users.id, nullable | Verifying supervisor |
| `status` | text enum | NOT NULL, default `pending` | `pending`, `verified`, `rejected` |
| `created_at` | timestamp | NOT NULL | Submission time |

### Table: `payments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Payment identifier |
| `application_id` | varchar (UUID) | FK → work_applications.id (CASCADE) | Parent application |
| `amount` | decimal (10,2) | NOT NULL | Payment amount |
| `period` | text | NOT NULL | Pay period label (e.g., "March 2024") |
| `status` | text enum | NOT NULL, default `pending` | `pending`, `processed`, `failed` |
| `processed_at` | timestamp | nullable | Processing timestamp |
| `created_at` | timestamp | NOT NULL | Record creation time |

### Table: `elections`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Election identifier |
| `title` | text | NOT NULL | Election name |
| `description` | text | NOT NULL | Election details |
| `start_date` | timestamp | NOT NULL | Voting start time |
| `end_date` | timestamp | NOT NULL | Voting end time |
| `status` | text enum | NOT NULL, default `upcoming` | `upcoming`, `active`, `completed` |
| `created_at` | timestamp | NOT NULL | Creation time |

### Table: `candidates`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Candidate identifier |
| `election_id` | varchar (UUID) | FK → elections.id (CASCADE) | Parent election |
| `user_id` | varchar (UUID) | FK → users.id (CASCADE) | Candidate's user |
| `position` | text | NOT NULL | Position running for |
| `manifesto` | text | NOT NULL | Campaign statement |
| `status` | text enum | NOT NULL, default `pending` | `pending`, `approved`, `rejected` |
| `created_at` | timestamp | NOT NULL | Nomination time |

### Table: `votes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Vote identifier |
| `election_id` | varchar (UUID) | FK → elections.id (CASCADE) | Parent election |
| `candidate_id` | varchar (UUID) | FK → candidates.id (CASCADE) | Voted-for candidate |
| `voter_id` | varchar (UUID) | FK → users.id (CASCADE) | Voter |
| `created_at` | timestamp | NOT NULL | Vote timestamp |

### Table: `handovers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | varchar (UUID) | PK | Handover identifier |
| `from_user_id` | varchar (UUID) | FK → users.id | Outgoing leader |
| `to_user_id` | varchar (UUID) | FK → users.id, nullable | Incoming leader |
| `position` | text | NOT NULL | Leadership position |
| `document_url` | text | nullable | Link to handover document |
| `notes` | text | nullable | Transition notes |
| `status` | text enum | NOT NULL, default `pending` | `pending`, `completed` |
| `completed_at` | timestamp | nullable | Completion timestamp |
| `created_at` | timestamp | NOT NULL | Creation time |

---

## 7. API Reference

All API endpoints are prefixed with `/api`. All endpoints except `/api/auth/register` and `/api/auth/login` require a valid `Authorization: Bearer <JWT>` header.

### Error Responses

All errors return JSON in the format:
```json
{ "error": "Human-readable error message" }
```

Standard HTTP status codes used:
- `400` — Bad request / validation error
- `401` — Missing or invalid token
- `403` — Insufficient role permissions
- `404` — Resource not found
- `500` — Internal server error

---

### Authentication

#### `POST /api/auth/register`

Create a new student account. Also creates a linked Chapa360 account automatically.

**Request Body:**
```json
{
  "email": "john.doe@ueab.ac.ke",
  "password": "securepassword123",
  "fullName": "John Doe",
  "universityId": "U2024001"
}
```

**Response `200 OK`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@ueab.ac.ke",
    "fullName": "John Doe",
    "role": "student",
    "universityId": "U2024001"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

#### `POST /api/auth/login`

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "john.doe@ueab.ac.ke",
  "password": "securepassword123"
}
```

**Response `200 OK`:** Same as register response.

---

#### `POST /api/auth/logout`

🔒 *Requires authentication*

Revoke the current JWT token (adds to server-side blacklist).

**Response `200 OK`:**
```json
{ "message": "Logged out successfully" }
```

---

#### `GET /api/auth/session`

🔒 *Requires authentication*

Validate the current token and retrieve the user profile.

**Response `200 OK`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john.doe@ueab.ac.ke",
    "fullName": "John Doe",
    "role": "student",
    "universityId": "U2024001"
  }
}
```

---

### Chapa360 — Finance

#### `GET /api/chapa360/account`

🔒 *Requires authentication*

Get the authenticated user's account summary.

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "balance": "12500.00",
  "accountNumber": "UEAB17123456",
  "createdAt": "2024-01-15T08:30:00Z",
  "recentTransactions": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "amount": "500.00",
      "type": "credit",
      "category": "Work-Study Payment",
      "description": "March 2024 work-study earnings",
      "status": "completed",
      "createdAt": "2024-03-31T10:00:00Z"
    }
  ],
  "totalCredits": 15000,
  "totalDebits": 2500,
  "transactionCount": 12
}
```

---

#### `GET /api/chapa360/transactions?filter=<type>`

🔒 *Requires authentication*

Get the authenticated user's full transaction history.

**Query Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `filter` | `all`, `credit`, `debit` | Filter by transaction type (default: all) |

**Response `200 OK`:** Array of transaction objects.

---

#### `GET /api/admin/chapa360/accounts`

🔒 *Requires `admin` or `treasurer` role*

Get all student accounts with linked user information.

**Response `200 OK`:** Array of account objects, each including a `user` nested object.

---

### SWSMS — Work Study

#### `GET /api/swsms/applications`

🔒 *Requires authentication*

Get all work-study applications submitted by the authenticated user.

**Response `200 OK`:** Array of work application objects.

---

#### `POST /api/swsms/applications`

🔒 *Requires authentication*

Submit a new work-study application.

**Request Body:**
```json
{
  "department": "Information Technology",
  "position": "Lab Assistant",
  "hoursPerWeek": 10,
  "reason": "I want to gain practical IT experience while supporting my studies."
}
```

**Response `200 OK`:** Created work application object with `status: "pending"`.

---

#### `GET /api/swsms/timecards`

🔒 *Requires authentication*

Get all timecards submitted by the authenticated user (includes linked application details).

**Response `200 OK`:** Array of timecard objects each with an `application` nested object.

---

#### `POST /api/swsms/timecards`

🔒 *Requires authentication*

Log a work hours entry. A QR code is auto-generated for supervisor verification.

**Request Body:**
```json
{
  "applicationId": "uuid-of-approved-application",
  "date": "2024-03-15T09:00:00Z",
  "hoursWorked": "4.5",
  "taskDescription": "Configured network switches in lab B"
}
```

**Response `200 OK`:** Created timecard object including the generated `qrCode`.

---

#### `GET /api/admin/swsms/applications`

🔒 *Requires `admin`, `supervisor`, or `treasurer` role*

Get all work-study applications from all students.

**Response `200 OK`:** Array of application objects each with a `user` nested object.

---

#### `PATCH /api/swsms/applications/:id/review`

🔒 *Requires `admin`, `supervisor`, or `treasurer` role*

Approve or reject a work-study application.

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Welcome to the IT department team!"
}
```

**Response `200 OK`:** Updated application object.

---

#### `GET /api/admin/swsms/timecards`

🔒 *Requires `admin`, `supervisor`, or `treasurer` role*

Get all timecards from all students with user and application details.

---

#### `PATCH /api/swsms/timecards/:id/verify`

🔒 *Requires `admin`, `supervisor`, or `treasurer` role*

Verify or reject a timecard entry.

**Request Body:**
```json
{
  "status": "verified"
}
```

**Response `200 OK`:** Updated timecard object.

---

### SGMS — Governance

#### `GET /api/sgms/elections`

🔒 *Requires authentication*

Get all elections with candidates, vote counts, and whether the current user has already voted.

**Response `200 OK`:**
```json
[
  {
    "id": "uuid",
    "title": "Student Body President 2024",
    "description": "Annual presidential election",
    "startDate": "2024-04-01T00:00:00Z",
    "endDate": "2024-04-07T00:00:00Z",
    "status": "active",
    "candidates": [
      {
        "id": "uuid",
        "position": "President",
        "manifesto": "I will advocate for student rights...",
        "status": "approved",
        "user": { "id": "uuid", "fullName": "Alice Smith" },
        "voteCount": 45,
        "votePercentage": 60,
        "hasVoted": false
      }
    ]
  }
]
```

---

#### `POST /api/sgms/vote`

🔒 *Requires authentication*

Cast a vote for a candidate. A student can only vote once per election.

**Request Body:**
```json
{
  "electionId": "uuid-of-election",
  "candidateId": "uuid-of-candidate"
}
```

**Response `200 OK`:** Created vote object.  
**Response `400`:** `"You have already voted in this election"` if a duplicate vote is attempted.

---

#### `POST /api/sgms/elections`

🔒 *Requires `admin` or `vc` role*

Create a new election.

**Request Body:**
```json
{
  "title": "Class Representative 2024",
  "description": "Election for second-year class representatives",
  "startDate": "2024-05-01T00:00:00Z",
  "endDate": "2024-05-05T00:00:00Z",
  "status": "upcoming"
}
```

**Response `200 OK`:** Created election object.

---

#### `GET /api/admin/sgms/elections`

🔒 *Requires `admin` or `vc` role*

Get all elections with aggregate counts (candidate count, total votes).

---

#### `GET /api/sgms/handovers`

🔒 *Requires authentication*

Get all leadership handover documents with creator details.

---

#### `POST /api/sgms/handovers`

🔒 *Requires authentication*

Create a new leadership handover document.

**Request Body:**
```json
{
  "toUserId": "uuid-of-incoming-leader",
  "position": "Student Association Treasurer",
  "documentUrl": "https://drive.google.com/...",
  "notes": "Please review the budget spreadsheet attached.",
  "status": "pending"
}
```

**Response `200 OK`:** Created handover object.

---

#### `PATCH /api/sgms/handovers/:id/complete`

🔒 *Requires authentication*

Mark a handover as completed.

**Response `200 OK`:** Updated handover object with `status: "completed"` and `completedAt` timestamp.

---

### Analytics

#### `GET /api/analytics/overview`

🔒 *Requires authentication*

Get dashboard KPI summary with trend indicators.

**Response `200 OK`:**
```json
{
  "balanceTrend": 12,
  "applicationsTrend": 5,
  "totalEarnings": 34200,
  "earningsTrend": 8
}
```

---

#### `GET /api/analytics/financial`

🔒 *Requires authentication*

Get monthly balance trend data for charts.

**Response `200 OK`:**
```json
[
  { "month": "Jan", "balance": 15000 },
  { "month": "Feb", "balance": 18500 }
]
```

---

#### `GET /api/analytics/work-study`

🔒 *Requires authentication*

Get weekly work-study hours data for charts.

**Response `200 OK`:**
```json
[
  { "week": "Week 1", "hours": 12 },
  { "week": "Week 2", "hours": 15 }
]
```

---

#### `GET /api/analytics/governance`

🔒 *Requires authentication*

Get historical election participation data for charts.

**Response `200 OK`:**
```json
[
  { "election": "2023 Fall", "candidates": 8, "votes": 450 },
  { "election": "2024 Spring", "candidates": 12, "votes": 520 }
]
```

---

## 8. Frontend Routing

All routes are defined in `client/src/App.tsx` using Wouter.

| Path | Component | Access |
|------|-----------|--------|
| `/` | Redirect to `/dashboard` | Public |
| `/login` | `Login` | Public (unauthenticated) |
| `/register` | `Register` | Public (unauthenticated) |
| `/dashboard` | `Dashboard` | All authenticated |
| `/analytics` | `Analytics` | All authenticated |
| `/chapa360/account` | `ChapAccount` | All authenticated |
| `/chapa360/transactions` | `ChapTransactions` | All authenticated |
| `/swsms/applications` | `SwsApplications` | All authenticated |
| `/swsms/timecards` | `SwsTimecards` | All authenticated |
| `/sgms/elections` | `SgmsElections` | All authenticated |
| `/sgms/handovers` | `SgmsHandovers` | All authenticated |
| `/admin/chapa360/accounts` | `AdminChapAccounts` | `admin`, `treasurer` |
| `/admin/swsms/vetting` | `AdminSwsVetting` | `admin`, `supervisor`, `treasurer` |
| `/admin/swsms/timecards` | `AdminSwsTimecards` | `admin`, `supervisor`, `treasurer` |
| `/admin/sgms/elections` | `AdminSgmsElections` | `admin`, `vc` |

The sidebar navigation (`components/app-sidebar.tsx`) renders menu items conditionally based on the authenticated user's role.

---

## 9. User Workflows

### New Student Onboarding

```
1. Visit /register
2. Fill in: Full Name, Email, University ID, Password
3. Account created (role: student, Chapa360 account auto-provisioned)
4. JWT token issued → stored in localStorage via Zustand
5. Redirected to /dashboard
```

### Applying for Work-Study

```
1. Navigate to SWSMS → My Applications
2. Click "New Application"
3. Fill in: Department, Position, Hours/Week, Reason
4. Submit → status set to "pending"
5. Admin receives application in /admin/swsms/vetting
6. Admin approves/rejects with optional notes
7. Student sees updated status on /swsms/applications
```

### Logging Work Hours

```
Prerequisite: Must have an APPROVED work application

1. Navigate to SWSMS → My Timecards
2. Click "Log Hours"
3. Select application, enter date, hours worked, task description
4. Submit → timecard created with auto-generated QR code, status "pending"
5. Supervisor views timecard at /admin/swsms/timecards
6. Supervisor verifies → status changes to "verified"
```

### Voting in an Election

```
1. Navigate to SGMS → Elections
2. View active election and candidates
3. Review manifestos
4. Click "Vote" next to preferred candidate
5. Confirmation dialog shown
6. Vote recorded → one-time per election enforced
7. Live vote counts update
```

### Creating a Leadership Handover

```
1. Navigate to SGMS → Handovers
2. Click "New Handover"
3. Fill in: Position, Incoming Leader (optional), Document URL, Notes
4. Submit → status "pending"
5. When transition is complete, click "Mark Complete"
6. Status changes to "completed" with timestamp
```

---

## 10. Installation & Setup

### Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | 18.x or higher |
| **npm** | 8.x or higher |
| **PostgreSQL** | 14+ (or a [Neon](https://neon.tech) serverless account) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/MEULE6028/SAMS.git
cd SAMS
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if an example exists
# OR create it manually:
touch .env
```

Populate it with the required variables (see [Environment Configuration](#11-environment-configuration)).

### Step 4: Set Up the Database

Push the Drizzle schema to your PostgreSQL database:

```bash
npm run db:push
```

### Step 5: Seed the Database (Optional)

Populate the database with sample data and test user accounts:

```bash
npx tsx server/seed.ts
```

This creates the following test accounts:

| Role | Email | Password |
|------|-------|----------|
| Student | student@ueab.ac.ke | password123 |
| Admin | admin@ueab.ac.ke | password123 |
| Supervisor | supervisor@ueab.ac.ke | password123 |

### Step 6: Run the Application

```bash
npm run dev
```

Open your browser at **http://localhost:5000**

---

## 11. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# ─── DATABASE ───────────────────────────────────────────────
# Neon serverless PostgreSQL connection string (or any PostgreSQL URL)
DATABASE_URL=postgresql://username:password@host:5432/database_name?sslmode=require

# ─── AUTHENTICATION ─────────────────────────────────────────
# Secret key for signing JWT tokens — use a long, random string
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-very-long-and-random-secret-key-here

# ─── APPLICATION ────────────────────────────────────────────
NODE_ENV=development   # 'development' or 'production'
PORT=5000              # Server port (default: 5000)
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

### Getting a Neon Database URL

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Paste it as `DATABASE_URL` in your `.env` file

---

## 12. Running the Application

### Development Mode

```bash
npm run dev
```

Starts both:
- **Express backend** on `http://localhost:5000` (with TSX hot-reloading)
- **Vite frontend dev server** (served through Express as middleware)

All API requests and the React app are served from the **same port (5000)**.

### Production Build

```bash
# 1. Build both frontend and backend
npm run build

# 2. Start the production server
npm start
```

The `build` command:
1. Runs `vite build` → outputs optimized frontend to `dist/public/`
2. Runs `esbuild` → bundles the server into `dist/index.js`

### TypeScript Type Checking

```bash
npm run check
```

Runs `tsc` without emitting files — purely for type-checking the codebase.

---

## 13. Database Management

### Push Schema Changes

After modifying `shared/schema.ts`, push changes to the database:

```bash
npm run db:push
```

This uses Drizzle Kit to introspect the schema and apply the necessary DDL changes.

### Running Migrations Manually

The `migrations/` folder contains SQL migration files generated by Drizzle Kit. These can be applied manually to a database if needed.

### Seeding the Database

```bash
npx tsx server/seed.ts
```

The seed script creates test users, accounts, sample transactions, a sample election, and sample work applications.

### Accessing the Database Directly

```bash
# With psql (replace with your DATABASE_URL)
psql "postgresql://username:password@host:5432/database_name"

# Useful queries:
SELECT * FROM users;
SELECT * FROM accounts;
SELECT * FROM work_applications WHERE status = 'pending';
SELECT * FROM elections;
```

---

## 14. Design System

SAMS uses a custom Tailwind CSS theme aligned with **UEAB's official brand colors**.

### Brand Colors

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `ueab-blue` | `#0033A0` | Primary actions, headers, navigation |
| `ueab-gold` | `#FFD100` | Accents, secondary actions, highlights |
| `blue-light` | `#4A7BE3` | Hover states, subtle backgrounds |
| `gold-light` | `#FFEA70` | Hover states on gold elements |

### Typography

- **Font:** Inter (loaded via Google Fonts CDN)
- **Headings:** `font-bold` to `font-semibold`
- **Body:** `text-sm` to `text-base`
- **Captions/Meta:** `text-xs`

### Dark Mode

Dark mode is supported via the `class` strategy (a `.dark` class on `<html>`). Toggle is available in the top navigation bar.

| Context | Light | Dark |
|---------|-------|------|
| Background | `hsl(0 0% 98%)` | `hsl(210 50% 8%)` |
| Surface | White | `hsl(210 40% 12%)` |
| Text | `hsl(210 100% 20%)` | `hsl(0 0% 95%)` |

### Status Badge Colors

| Status | Style |
|--------|-------|
| `pending` | Yellow background, yellow text |
| `approved` / `verified` | Green background, green text |
| `rejected` | Red background, red text |
| `active` | Blue background, blue text |
| `completed` | Gray background, gray text |

### Layout

- **Sidebar:** Fixed 240px width (collapsible on mobile)
- **Main content:** `flex-1` with `max-w-7xl` for wide displays
- **Card grids:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

See [`design_guidelines.md`](./design_guidelines.md) for the complete design specification including component variants, animation guidelines, and accessibility requirements.

---

## 15. Project Structure

```
SAMS/
│
├── client/                          # Frontend React application
│   ├── index.html                   # HTML entry point
│   ├── public/                      # Static assets (favicon, images)
│   └── src/
│       ├── main.tsx                 # React root mount
│       ├── App.tsx                  # Root component: routing, providers
│       ├── index.css                # Global styles + Tailwind directives
│       │
│       ├── components/
│       │   ├── app-sidebar.tsx      # Navigation sidebar (role-aware)
│       │   ├── theme-toggle.tsx     # Dark/light mode toggle
│       │   └── ui/                  # 40+ Shadcn/Radix UI components
│       │
│       ├── pages/
│       │   ├── dashboard.tsx        # Main dashboard (role-based KPIs)
│       │   ├── analytics.tsx        # Analytics charts and metrics
│       │   ├── login.tsx            # JWT login form
│       │   ├── register.tsx         # User registration form
│       │   │
│       │   ├── chapa360/
│       │   │   ├── account.tsx      # Account balance & recent transactions
│       │   │   └── transactions.tsx # Full transaction history
│       │   │
│       │   ├── swsms/
│       │   │   ├── applications.tsx # Submit & view work applications
│       │   │   └── timecards.tsx    # Log & view work timecards
│       │   │
│       │   ├── sgms/
│       │   │   ├── elections.tsx    # View elections & vote
│       │   │   └── handovers.tsx    # Create & manage handovers
│       │   │
│       │   └── admin/
│       │       ├── chapa360/
│       │       │   └── accounts.tsx # View all student accounts
│       │       ├── swsms/
│       │       │   ├── vetting.tsx  # Review work applications
│       │       │   └── timecards.tsx# Verify student timecards
│       │       └── sgms/
│       │           └── elections.tsx# Create & manage elections
│       │
│       ├── lib/
│       │   ├── auth.ts              # Zustand auth store (JWT persistence)
│       │   ├── queryClient.ts       # TanStack Query client + auth headers
│       │   └── utils.ts             # Tailwind class merge utility
│       │
│       └── hooks/
│           └── use-toast.ts         # Toast notification hook
│
├── server/                          # Backend Express application
│   ├── index.ts                     # Server entry point & middleware setup
│   ├── routes.ts                    # All API route handlers
│   ├── auth.ts                      # JWT utils, middleware, RBAC
│   ├── db.ts                        # Neon PostgreSQL database client
│   ├── seed.ts                      # Database seeding script
│   ├── storage.ts                   # (Legacy) storage interface
│   └── vite.ts                      # Vite dev server integration
│
├── shared/                          # Shared between client and server
│   └── schema.ts                    # Drizzle ORM schema + Zod validators + types
│
├── migrations/                      # SQL migration files
│   └── 0000_nappy_mantis.sql        # Initial database schema migration
│
├── .env                             # Environment variables (NOT committed)
├── .gitignore                       # Git ignore rules
├── drizzle.config.ts                # Drizzle Kit configuration
├── package.json                     # Dependencies and scripts
├── tailwind.config.ts               # Tailwind custom theme
├── tsconfig.json                    # TypeScript compiler config
├── vite.config.ts                   # Vite bundler config
├── postcss.config.js                # PostCSS config (Tailwind, Autoprefixer)
├── design_guidelines.md             # UI/UX design specification
└── README.md                        # This file
```

---

## 16. Security

### Password Security
- All passwords hashed with **bcrypt** using **10 salt rounds**
- Plain-text passwords are never stored or logged

### JWT Security
- Tokens signed with `HS256` algorithm using `JWT_SECRET`
- Token expiry: **7 days**
- Server-side **token blacklist** prevents use of revoked tokens after logout
- The `JWT_SECRET` environment variable is **required** — the server throws on startup if missing

### Authorization
- Every protected endpoint applies `authMiddleware` before processing
- Role-specific endpoints additionally apply `requireRole()` middleware
- Self-registration is locked to `student` role — privilege escalation is not possible through the API

### Input Validation
- All incoming request bodies are validated using **Zod schemas** derived from the Drizzle table definitions
- Invalid input returns `400` with a descriptive error message before any database interaction

### Known Limitations
- The token blacklist is **in-memory only** — it resets when the server restarts. Tokens remain cryptographically valid until their `exp` claim but will no longer be blacklisted after a restart. This is an acceptable trade-off for the current deployment model.
- No rate limiting is currently implemented on the authentication endpoints.
- The analytics endpoints return **static placeholder data** — they do not yet aggregate live database records.

---

## 17. Future Roadmap

| Feature | Description |
|---------|-------------|
| **QuickBooks Integration** | Live financial synchronization with institutional accounting |
| **M-Pesa Payment Gateway** | Mobile money payments for work-study earnings |
| **University ERP Integration** | Auto-import of student enrollment and course data |
| **Real-time Notifications** | Email/SMS alerts for application status changes, election results |
| **Advanced Reporting** | PDF/Excel export of financial statements, work-study reports |
| **Audit Trail** | Immutable log of all administrative actions |
| **Document Upload** | File storage for handover documents, application attachments |
| **Multi-factor Authentication** | TOTP or email-based 2FA |
| **Persistent Token Blacklist** | Redis or database-backed token revocation |
| **Rate Limiting** | API rate limiting on auth endpoints to prevent brute force |
| **Live Analytics** | Replace static analytics with real aggregated database queries |

---

## 18. Troubleshooting

### `JWT_SECRET must be set in environment variables`

**Cause:** The server cannot find a `JWT_SECRET` in the environment.  
**Fix:** Ensure your `.env` file exists in the project root and contains `JWT_SECRET=<your-secret>`. Run `npm run dev` from the project root.

---

### `Error: Cannot connect to database`

**Cause:** The `DATABASE_URL` is missing, incorrect, or the database server is unreachable.  
**Fix:**
1. Verify `DATABASE_URL` in your `.env` file
2. For Neon: confirm your project is active at [console.neon.tech](https://console.neon.tech)
3. Ensure the database accepts connections from your IP

---

### `Email already registered` on registration

**Cause:** An account with that email already exists in the database.  
**Fix:** Use a different email address, or log in with the existing account.

---

### `401 Unauthorized` on all API requests after login

**Cause:** The stored token may have expired or been blacklisted (e.g., after a server restart that cleared the in-memory blacklist).  
**Fix:** Log out and log in again to receive a fresh token.

---

### `403 Insufficient permissions`

**Cause:** Your user account does not have the required role to access that endpoint or page.  
**Fix:** Ensure your account's `role` column in the database is set appropriately (`admin`, `supervisor`, `treasurer`, or `vc` as needed).

---

### Database schema out of sync

**Cause:** The `shared/schema.ts` was updated but changes weren't pushed to the database.  
**Fix:**
```bash
npm run db:push
```

---

### Port 5000 already in use

**Cause:** Another process is running on port 5000.  
**Fix:**
```bash
# Find the process using port 5000
lsof -i :5000

# Kill it (replace PID with the actual process ID)
kill <PID>

# OR change the port in .env
PORT=3000
```

---

### Frontend shows blank page / 404 on direct URL access

**Cause:** In development, all routes are served by Express/Vite. Ensure `npm run dev` is running (not a static file server).  
**Fix:** Always use `npm run dev` for development. For production, use `npm run build && npm start`.

---

*For additional help or to report bugs, please open an issue on the [GitHub repository](https://github.com/MEULE6028/SAMS/issues).*

# Taskflow

A full-stack SaaS task management application built for individuals and small teams who want a focused, fast workspace to organize their work — without the overhead of bloated project management tools.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

---

## Features

- **Authentication** — Secure sign-up and sign-in powered by Clerk with email/password and social OAuth providers
- **Projects** — Create color-coded projects to group related tasks; track completion progress per project
- **Tasks** — Full task lifecycle management with status (`todo`, `in_progress`, `done`), priority levels (`low`, `medium`, `high`), due dates, and project assignment
- **Dashboard** — At-a-glance summary statistics (total tasks, completion rate, high-priority count, due-soon alerts) plus a live activity feed
- **Filtering** — Filter tasks by status, priority, and project across the full task list or within individual projects
- **Activity Logging** — Every task action (create, update, status change) is automatically logged and surfaced in the activity feed
- **Real-time UI updates** — Optimistic cache invalidation via React Query keeps the UI fresh after every mutation

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tool and dev server |
| TypeScript | Type safety across the entire codebase |
| Tailwind CSS v4 | Utility-first styling with a custom design system |
| shadcn/ui | Accessible, composable UI component library |
| wouter | Lightweight client-side routing |
| TanStack Query (React Query) | Server state management, caching, background refetching |
| react-hook-form + Zod | Form handling with schema validation |
| Clerk (`@clerk/react`) | Authentication UI and session management |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| TypeScript | End-to-end type safety |
| Drizzle ORM | Type-safe SQL query builder |
| PostgreSQL | Relational database |
| Clerk (`@clerk/express`) | JWT verification and auth middleware |
| pino | Structured JSON logging |

### Architecture & Tooling
| Technology | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management |
| OpenAPI 3.0 | API contract definition |
| Orval | Code generation — React Query hooks + Zod schemas from OpenAPI spec |
| ESBuild | Fast server bundling |

---

## Project Structure

```
taskflow/
├── artifacts/
│   ├── task-manager/          # React + Vite frontend
│   │   ├── src/
│   │   │   ├── pages/         # Route-level page components
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── lib/           # Utilities and queryClient
│   │   │   └── App.tsx        # Root with ClerkProvider and routing
│   │   └── vite.config.ts
│   └── api-server/            # Express 5 REST API
│       └── src/
│           ├── routes/        # projects.ts, tasks.ts, dashboard.ts
│           ├── middlewares/   # Clerk proxy middleware
│           ├── lib/           # Logger
│           └── app.ts         # Express app setup
├── lib/
│   ├── api-spec/              # OpenAPI 3.0 spec + Orval config
│   ├── api-zod/               # Generated Zod validation schemas
│   ├── api-client-react/      # Generated React Query hooks
│   └── db/                    # Drizzle schema, migrations, DB client
├── docs/
│   └── taskflow-uml-diagrams.md  # UML design documentation
├── pnpm-workspace.yaml
└── README.md
```

---

## API Endpoints

All endpoints are prefixed with `/api` and require a valid Clerk JWT in the `Authorization` header.

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects for the authenticated user |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get a single project with task counts |
| `PATCH` | `/api/projects/:id` | Update project name, description, or color |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `GET` | `/api/projects/:id/tasks` | List all tasks belonging to a project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks (supports `?status`, `?priority`, `?projectId` filters) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get a single task |
| `PATCH` | `/api/tasks/:id` | Update task fields |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PATCH` | `/api/tasks/:id/status` | Update only the status of a task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/summary` | Aggregate stats (counts by status, priority, completion rate) |
| `GET` | `/api/dashboard/activity` | Recent activity feed (last 20 entries) |

---

## Database Schema

```
users          — Clerk user profiles (synced on first auth)
projects       — User projects with name, description, color
tasks          — Tasks with status, priority, due date, project FK
activity       — Append-only log of task actions
```

### Entity Relationships
- A **User** owns many **Projects** and many **Tasks**
- A **Project** contains many **Tasks**
- Every **Task** mutation creates an **Activity** record

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database
- Clerk account ([clerk.com](https://clerk.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/LAzzawi/FullStack-SaaS-Task-Manager.git
cd FullStack-SaaS-Task-Manager

# Install all workspace dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in `artifacts/api-server/` and `artifacts/task-manager/` based on the examples below.

**`artifacts/api-server/.env`**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
PORT=8080
```

**`artifacts/task-manager/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_PROXY_URL=
PORT=3000
BASE_PATH=/
```

### Database Setup

```bash
# Push the schema to your database
pnpm --filter @workspace/db run push
```

### Running the Application

```bash
# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (port 3000)
pnpm --filter @workspace/task-manager run dev
```

### Code Generation

After modifying the OpenAPI spec (`lib/api-spec/openapi.yaml`), regenerate the client hooks and Zod schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Architecture Overview

```
Browser
  └── React SPA (Vite)
        ├── ClerkProvider  ──────────────────────► Clerk Auth Service
        ├── React Query
        │     └── API Hooks ──► /api  ──► Express API Server
        │                                      ├── requireAuth() ──► Clerk JWT verify
        │                                      └── Drizzle ORM ──────► PostgreSQL
        └── wouter Router
```

All API traffic flows through a reverse proxy that routes `/api` to the Express server and `/` to the Vite-served React app. Authentication is enforced at the Express middleware layer on every protected route — no request reaches a handler without a verified Clerk JWT.

---

## Design Decisions

**Contract-first API development** — The OpenAPI spec is the single source of truth. All Zod schemas and React Query hooks are generated from it, eliminating hand-written API client code and ensuring the frontend and backend stay in sync.

**Monorepo with pnpm workspaces** — Shared libraries (`api-spec`, `api-zod`, `api-client-react`, `db`) live as separate workspace packages, enabling clean dependency boundaries with full TypeScript type sharing across frontend and backend.

**Clerk for authentication** — Offloads the complexity of session management, token refresh, and OAuth provider integrations while keeping a proxy-based setup that works identically in development and production.

**Drizzle ORM** — Chosen for its lightweight footprint, first-class TypeScript inference, and SQL-close query syntax — no magic, full control over queries.

---

## Documentation

Full UML design documentation is available in [`docs/taskflow-uml-diagrams.md`](./docs/taskflow-uml-diagrams.md), including:
- Use Case Diagram
- Activity Diagrams (authentication, task management, project creation)
- Component Diagram
- Sequence Diagrams (sign-in, create task, update status, delete project)
- Class Diagram with entity relationships

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

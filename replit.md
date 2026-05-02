# Taskflow — SaaS Task Manager

A full-stack task management SaaS built with React + Vite, Express/Node.js, PostgreSQL, and Clerk authentication.

## Architecture

### Monorepo structure (pnpm workspaces)
- `artifacts/task-manager/` — React + Vite frontend (port from $PORT env)
- `artifacts/api-server/` — Express 5 backend (port 8080)
- `lib/api-spec/` — OpenAPI specification + codegen config (Orval)
- `lib/api-zod/` — Generated Zod schemas from OpenAPI spec
- `lib/api-client-react/` — Generated React Query hooks from OpenAPI spec
- `lib/db/` — Drizzle ORM schema + database client

### Tech stack
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui components
- **Auth**: Clerk (via `@clerk/react` + `@clerk/express`), Clerk proxy middleware on API server
- **Backend**: Express 5, pino logger, Drizzle ORM
- **Database**: PostgreSQL (Replit-managed), via `DATABASE_URL`
- **API contract**: OpenAPI 3.0 spec → Orval codegen → Zod schemas + React Query hooks
- **Routing**: wouter (frontend), Express Router (backend)
- **Forms**: react-hook-form + zod

## Key files
- `artifacts/task-manager/src/App.tsx` — ClerkProvider + wouter routing setup
- `artifacts/task-manager/src/index.css` — Tailwind v4 theme (indigo primary, custom sidebar vars)
- `artifacts/task-manager/src/pages/` — All pages (landing, dashboard, projects, project-detail, tasks, settings)
- `artifacts/task-manager/src/components/` — Sidebar, TaskDialog, ProjectDialog, shadcn/ui
- `artifacts/api-server/src/routes/` — projects.ts, tasks.ts, dashboard.ts
- `artifacts/api-server/src/app.ts` — Express app with Clerk proxy middleware
- `lib/db/src/schema/` — users, projects, tasks, activity tables
- `lib/api-spec/openapi.yaml` — OpenAPI 3.0 source of truth

## Routes

### Frontend
- `/` — Landing page (signed-out) / redirect to dashboard (signed-in)
- `/sign-in/*?` — Clerk sign-in
- `/sign-up/*?` — Clerk sign-up
- `/dashboard` — Stats overview + recent activity
- `/projects` — All projects list
- `/projects/:id` — Single project with tasks
- `/tasks` — All tasks with filters
- `/settings` — User profile + sign-out

### API (`/api` prefix via proxy)
- `GET/POST /api/projects` — List/create projects
- `GET/PATCH/DELETE /api/projects/:id` — Single project
- `GET /api/projects/:id/tasks` — Project tasks
- `GET/POST /api/tasks` — List/create tasks (with status/priority/projectId filters)
- `GET/PATCH/DELETE /api/tasks/:id` — Single task
- `PATCH /api/tasks/:id/status` — Update task status
- `GET /api/dashboard/summary` — Dashboard stats
- `GET /api/dashboard/activity` — Recent activity feed

## Development

### Run codegen (after OpenAPI spec changes)
```bash
pnpm --filter @workspace/api-spec run codegen
```

### Push DB schema changes
```bash
pnpm --filter @workspace/db run push
```

### Typecheck
```bash
pnpm run typecheck
```

## Environment variables / secrets
- `DATABASE_URL` — PostgreSQL connection string (Replit-managed)
- `SESSION_SECRET` — Session secret
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (set by Replit Clerk integration)
- `CLERK_SECRET_KEY` — Clerk secret key (set by Replit Clerk integration)
- `VITE_CLERK_PROXY_URL` — Clerk proxy URL (set automatically in production)

## Design notes
- Primary color: indigo (`#4F46E5`, `hsl(239 84% 67%)`)
- Sidebar: dark navy (`hsl(222 30% 14%)`)
- Font: Inter
- Tailwind v4 with `@layer theme, base, clerk, components, utilities` for Clerk theme compatibility
- vite.config.ts uses `tailwindcss({ optimize: false })` for Clerk themes to work

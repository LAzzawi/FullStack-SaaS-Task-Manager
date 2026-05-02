# Taskflow — UML Design Documentation

**Project:** Taskflow SaaS Task Manager  
**Stack:** React + Vite, Express 5, PostgreSQL, Drizzle ORM, Clerk Auth  
**Date:** May 2026

---

## 1. Use Case Diagram

Describes the interactions between actors (users and the system) and the features of Taskflow.

```mermaid
%%{init: {"theme": "default"}}%%
graph TD
    User(["👤 User"])
    Clerk(["🔐 Clerk Auth Service"])
    DB(["🗄️ PostgreSQL"])

    subgraph Taskflow System
        UC1([Sign Up])
        UC2([Sign In])
        UC3([Sign Out])
        UC4([View Dashboard])
        UC5([View Summary Stats])
        UC6([View Activity Feed])
        UC7([Create Project])
        UC8([Edit Project])
        UC9([Delete Project])
        UC10([View Project Details])
        UC11([Create Task])
        UC12([Edit Task])
        UC13([Delete Task])
        UC14([Update Task Status])
        UC15([Filter Tasks])
        UC16([View All Tasks])
        UC17([View Profile])
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    User --> UC16
    User --> UC17

    UC4 --> UC5
    UC4 --> UC6

    UC1 --> Clerk
    UC2 --> Clerk
    UC3 --> Clerk

    UC7 --> DB
    UC8 --> DB
    UC9 --> DB
    UC10 --> DB
    UC11 --> DB
    UC12 --> DB
    UC13 --> DB
    UC14 --> DB
    UC15 --> DB
    UC16 --> DB
    UC4 --> DB
```

### Actors

| Actor | Description |
|-------|-------------|
| **User** | Authenticated person managing projects and tasks |
| **Clerk Auth Service** | External identity provider handling sign-up, sign-in, and session management |
| **PostgreSQL** | Database storing all persistent application data |

### Use Cases Summary

| ID | Use Case | Actor | Description |
|----|----------|-------|-------------|
| UC1 | Sign Up | User, Clerk | Register a new account |
| UC2 | Sign In | User, Clerk | Log in with existing credentials |
| UC3 | Sign Out | User, Clerk | End current session |
| UC4 | View Dashboard | User, DB | See summary stats and recent activity |
| UC5 | View Summary Stats | User, DB | Counts for tasks by status, priority, completion rate |
| UC6 | View Activity Feed | User, DB | Timeline of recent task actions |
| UC7 | Create Project | User, DB | Add a new project with name, description, color |
| UC8 | Edit Project | User, DB | Modify project name, description, or color |
| UC9 | Delete Project | User, DB | Remove a project |
| UC10 | View Project Details | User, DB | See all tasks belonging to a project |
| UC11 | Create Task | User, DB | Add a task with title, priority, status, due date |
| UC12 | Edit Task | User, DB | Modify task fields |
| UC13 | Delete Task | User, DB | Remove a task |
| UC14 | Update Task Status | User, DB | Toggle todo → in_progress → done |
| UC15 | Filter Tasks | User, DB | Filter by status, priority, or project |
| UC16 | View All Tasks | User, DB | See all tasks across projects |
| UC17 | View Profile | User, Clerk | View account name, email, avatar |

---

## 2. Activity Diagram

Shows the flow of key user activities within the application.

### 2a. User Authentication Flow

```mermaid
flowchart TD
    Start([Start]) --> A[User visits Taskflow]
    A --> B{Signed in?}
    B -- Yes --> C[Redirect to Dashboard]
    B -- No --> D[Show Landing Page]
    D --> E{User action?}
    E -- Sign Up --> F[Navigate to /sign-up]
    E -- Sign In --> G[Navigate to /sign-in]
    F --> H[Enter name, email, password]
    G --> I[Enter email, password]
    H --> J[Clerk validates credentials]
    I --> J
    J --> K{Valid?}
    K -- No --> L[Show error message]
    L --> E
    K -- Yes --> M[Clerk issues session token]
    M --> C
    C --> N[User works in app]
    N --> O{Sign out?}
    O -- No --> N
    O -- Yes --> P[Clerk clears session]
    P --> D
```

### 2b. Task Management Flow

```mermaid
flowchart TD
    Start([Authenticated User]) --> A[Navigate to Tasks page]
    A --> B[View task list]
    B --> C{Action?}

    C -- Create --> D[Click New Task button]
    D --> E[Fill title, priority, status, due date, project]
    E --> F{Form valid?}
    F -- No --> G[Show validation errors]
    G --> E
    F -- Yes --> H[POST /api/tasks]
    H --> I[Task saved to DB]
    I --> J[Activity logged]
    J --> B

    C -- Edit --> K[Click edit icon on task]
    K --> L[Open task dialog pre-filled]
    L --> M[Modify fields]
    M --> N[PATCH /api/tasks/:id]
    N --> O[Task updated in DB]
    O --> J

    C -- Toggle Status --> P[Click status icon on task]
    P --> Q[PATCH /api/tasks/:id/status]
    Q --> R[Status updated in DB]
    R --> J

    C -- Delete --> S[Click delete icon]
    S --> T[DELETE /api/tasks/:id]
    T --> U[Task removed from DB]
    U --> B

    C -- Filter --> V[Select status / priority / project filter]
    V --> W[GET /api/tasks?status=...&priority=...]
    W --> X[Display filtered results]
    X --> C
```

### 2c. Project Creation Flow

```mermaid
flowchart TD
    Start([User on Projects page]) --> A[Click New Project]
    A --> B[Open Project Dialog]
    B --> C[Enter name]
    C --> D[Enter description - optional]
    D --> E[Select color]
    E --> F{Form valid?}
    F -- No --> G[Show validation error]
    G --> C
    F -- Yes --> H[POST /api/projects]
    H --> I[Project saved to DB]
    I --> J[Dialog closes]
    J --> K[Projects list refreshes]
    K --> L[New project card visible]
    L --> M{User action?}
    M -- View tasks --> N[Navigate to /projects/:id]
    M -- Edit --> O[Open edit dialog]
    M -- Delete --> P[DELETE /api/projects/:id]
    P --> K
```

---

## 3. Component Diagram

Shows the architecture of the system and how components interact.

```mermaid
graph TB
    subgraph Client ["Browser (React App)"]
        direction TB
        Router["wouter Router"]
        ClerkProvider["ClerkProvider"]
        QueryProvider["React Query\nQueryClientProvider"]

        subgraph Pages
            Landing["Landing Page"]
            Dashboard["Dashboard Page"]
            Projects["Projects Page"]
            ProjectDetail["Project Detail Page"]
            Tasks["Tasks Page"]
            Settings["Settings Page"]
            SignIn["Sign In Page"]
            SignUp["Sign Up Page"]
        end

        subgraph Components
            Sidebar["Sidebar\nNavigation"]
            TaskDialog["Task\nDialog"]
            ProjectDialog["Project\nDialog"]
            UILib["shadcn/ui\nComponents"]
        end

        subgraph Hooks ["API Hooks (@workspace/api-client-react)"]
            ProjectHooks["useListProjects\nuseCreateProject\nuseGetProject\nuseUpdateProject\nuseDeleteProject"]
            TaskHooks["useListTasks\nuseCreateTask\nuseGetTask\nuseUpdateTask\nuseDeleteTask\nuseUpdateTaskStatus\nuseListProjectTasks"]
            DashboardHooks["useGetDashboardSummary\nuseGetRecentActivity"]
        end
    end

    subgraph Proxy ["Reverse Proxy (Port 80)"]
        ProxyRouter["Path-based Router\n/ → task-manager\n/api → api-server"]
    end

    subgraph APIServer ["API Server (Express 5, Port 8080)"]
        direction TB
        ClerkMiddleware["Clerk Proxy\nMiddleware"]
        AuthMiddleware["requireAuth()\nMiddleware"]

        subgraph Routes
            ProjectRoutes["Project Routes\n/api/projects"]
            TaskRoutes["Task Routes\n/api/tasks"]
            DashboardRoutes["Dashboard Routes\n/api/dashboard"]
            HealthRoute["Health Route\n/api/healthz"]
        end

        DrizzleORM["Drizzle ORM\n(@workspace/db)"]
    end

    subgraph Database ["PostgreSQL Database"]
        UsersTable["users"]
        ProjectsTable["projects"]
        TasksTable["tasks"]
        ActivityTable["activity"]
    end

    subgraph ExternalServices ["External Services"]
        ClerkService["Clerk\nAuthentication\nService"]
    end

    Client --> Proxy
    Proxy --> APIServer
    ClerkProvider <--> ClerkService
    ClerkMiddleware <--> ClerkService
    APIServer --> DrizzleORM
    DrizzleORM --> Database
    Hooks --> Proxy
```

---

## 4. Sequence Diagram

Shows the step-by-step message flow for key operations.

### 4a. User Sign-In Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as React App
    participant Clerk as Clerk Service
    participant API as API Server
    participant DB as PostgreSQL

    User->>Browser: Navigate to /sign-in
    Browser->>Browser: Render SignIn component
    User->>Browser: Enter email & password
    Browser->>Clerk: POST credentials
    Clerk->>Clerk: Validate credentials
    Clerk-->>Browser: Return session token + JWT
    Browser->>Browser: Store session (ClerkProvider)
    Browser->>Browser: Redirect to /dashboard
    Browser->>API: GET /api/dashboard/summary\n(Authorization: Bearer JWT)
    API->>Clerk: Validate JWT token
    Clerk-->>API: Token valid, userId = "user_xyz"
    API->>DB: SELECT task stats WHERE userId = "user_xyz"
    DB-->>API: Return counts
    API-->>Browser: Return DashboardSummary JSON
    Browser->>Browser: Render stat cards
```

### 4b. Create Task Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as React App
    participant API as API Server
    participant DB as PostgreSQL

    User->>Browser: Click "New Task" button
    Browser->>Browser: Open TaskDialog modal
    User->>Browser: Fill title, priority, status,\ndue date, project
    Browser->>Browser: react-hook-form validates fields
    User->>Browser: Click "Create task"
    Browser->>API: POST /api/tasks\n{ title, priority, status, projectId, dueDate }
    API->>API: requireAuth() — verify JWT
    API->>DB: INSERT INTO tasks (userId, title, ...) RETURNING *
    DB-->>API: Return new task row
    API->>DB: INSERT INTO activity (userId, taskId, "created")
    DB-->>API: Activity logged
    API->>DB: SELECT project WHERE id = projectId
    DB-->>API: Return project (for name + color)
    API-->>Browser: Return task with projectName, projectColor
    Browser->>Browser: Close dialog
    Browser->>Browser: Invalidate React Query caches\n(tasks, dashboard, activity)
    Browser->>API: GET /api/tasks (refetch)
    API->>DB: SELECT tasks WHERE userId = ...
    DB-->>API: Return updated task list
    API-->>Browser: Return tasks array
    Browser->>Browser: Re-render task list with new task
```

### 4c. Update Task Status Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as React App
    participant API as API Server
    participant DB as PostgreSQL

    User->>Browser: Click status icon on task row
    Browser->>Browser: Compute nextStatus\n(todo → in_progress → done → todo)
    Browser->>API: PATCH /api/tasks/:id/status\n{ status: "in_progress" }
    API->>API: requireAuth() — verify JWT
    API->>DB: SELECT task WHERE id = :id AND userId = userId
    DB-->>API: Return existing task
    API->>DB: UPDATE tasks SET status = "in_progress"\nWHERE id = :id RETURNING *
    DB-->>API: Return updated task
    API->>DB: INSERT INTO activity\n(userId, taskId, "status changed to in_progress")
    DB-->>API: Activity logged
    API-->>Browser: Return updated task JSON
    Browser->>Browser: Invalidate task list + dashboard cache
    Browser->>Browser: Re-render updated task row
    Browser->>Browser: Re-render dashboard stats
```

### 4d. Delete Project Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as React App
    participant API as API Server
    participant DB as PostgreSQL

    User->>Browser: Click "Delete project" in dropdown
    Browser->>API: DELETE /api/projects/:id
    API->>API: requireAuth() — verify JWT
    API->>DB: SELECT project WHERE id = :id AND userId = userId
    DB-->>API: Project exists
    API->>DB: DELETE FROM projects WHERE id = :id
    DB-->>API: 204 No Content
    API-->>Browser: 204 No Content
    Browser->>Browser: Invalidate projects list cache
    Browser->>Browser: Navigate to /projects
    Browser->>API: GET /api/projects (refetch)
    DB-->>API: Updated project list
    API-->>Browser: Projects without deleted one
    Browser->>Browser: Re-render projects page
```

---

## 5. Class Diagram

Shows the data models, their attributes, types, and relationships.

```mermaid
classDiagram
    class User {
        +String id (Clerk userId)
        +String email
        +String firstName
        +String lastName
        +String imageUrl
        +Date createdAt
    }

    class Project {
        +Int id PK
        +String userId FK
        +String name
        +String|null description
        +String color
        +Date createdAt
        +Date updatedAt
        +Int taskCount (computed)
        +Int completedCount (computed)
        +createProject()
        +updateProject()
        +deleteProject()
        +listTasks()
    }

    class Task {
        +Int id PK
        +String userId FK
        +Int|null projectId FK
        +String title
        +String|null description
        +TaskStatus status
        +TaskPriority priority
        +String|null dueDate
        +Date createdAt
        +Date updatedAt
        +String|null projectName (joined)
        +String|null projectColor (joined)
        +createTask()
        +updateTask()
        +deleteTask()
        +updateStatus()
    }

    class Activity {
        +Int id PK
        +String userId FK
        +Int taskId FK
        +String action
        +Date createdAt
        +String taskTitle (joined)
        +String|null projectName (joined)
        +String|null projectColor (joined)
    }

    class DashboardSummary {
        +Int totalTasks
        +Int todoCount
        +Int inProgressCount
        +Int doneCount
        +Int totalProjects
        +Int highPriorityCount
        +Int dueSoonCount
        +Int completionRate
    }

    class TaskStatus {
        <<enumeration>>
        TODO
        IN_PROGRESS
        DONE
    }

    class TaskPriority {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
    }

    User "1" --> "0..*" Project : owns
    User "1" --> "0..*" Task : owns
    User "1" --> "0..*" Activity : generates
    Project "1" --> "0..*" Task : contains
    Task "1" --> "0..*" Activity : recorded in
    Task --> TaskStatus : has
    Task --> TaskPriority : has
    User "1" --> "1" DashboardSummary : views
```

### Data Model Details

#### Task Status Transitions

```mermaid
stateDiagram-v2
    [*] --> Todo : Task created
    Todo --> InProgress : Start working
    InProgress --> Done : Complete task
    Done --> Todo : Re-open
    InProgress --> Todo : Reset
    Todo --> Done : Mark complete directly
```

#### Entity Relationships

| Relationship | Type | Description |
|---|---|---|
| User → Project | One-to-Many | A user owns multiple projects |
| User → Task | One-to-Many | A user owns multiple tasks |
| Project → Task | One-to-Many | A project contains multiple tasks |
| Task → Activity | One-to-Many | Each task action creates an activity log entry |
| User → Activity | One-to-Many | All activity is scoped to a user |

---

## System Overview

```mermaid
graph LR
    subgraph Frontend
        A[React + Vite\nSPA]
    end

    subgraph Backend
        B[Express 5\nREST API]
        C[Drizzle ORM]
    end

    subgraph Auth
        D[Clerk\nAuthentication]
    end

    subgraph Data
        E[(PostgreSQL)]
    end

    A -- "HTTP + JWT" --> B
    A -- "OAuth / Session" --> D
    B -- "Verify JWT" --> D
    B --> C
    C --> E
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite 7, Tailwind CSS v4 | UI rendering and user interaction |
| Routing | wouter | Client-side SPA routing |
| State / Data Fetching | React Query (TanStack) | Server state, caching, background refetch |
| Form Handling | react-hook-form + Zod | Validated form inputs |
| Authentication | Clerk | User identity, sessions, OAuth |
| API | Express 5, TypeScript | REST endpoints, business logic |
| ORM | Drizzle ORM | Type-safe SQL query builder |
| Database | PostgreSQL | Persistent relational data storage |
| API Contract | OpenAPI 3.0 + Orval | Code-generated hooks and Zod schemas |

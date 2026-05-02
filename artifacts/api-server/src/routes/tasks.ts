import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db, tasksTable, projectsTable, activityTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskStatusBody,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
  UpdateTaskStatusParams,
  ListTasksQueryParams,
  ListProjectTasksParams,
  ListProjectTasksQueryParams,
} from "@workspace/api-zod";

const router = Router();

async function logActivity(userId: string, taskId: number, action: string) {
  try {
    await db.insert(activityTable).values({ userId, taskId, action });
  } catch (_err) {
    // non-critical
  }
}

function taskWithProject(row: {
  task: typeof tasksTable.$inferSelect;
  project: typeof projectsTable.$inferSelect | null;
}) {
  return {
    ...row.task,
    projectName: row.project?.name ?? null,
    projectColor: row.project?.color ?? null,
  };
}

// GET /tasks - list all tasks for user
router.get("/", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const qp = ListTasksQueryParams.safeParse({
    status: req.query.status,
    priority: req.query.priority,
    projectId: req.query.projectId ? Number(req.query.projectId) : undefined,
  });

  try {
    const query = db
      .select({
        task: tasksTable,
        project: projectsTable,
      })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(
        and(
          eq(tasksTable.userId, userId),
          qp.success && qp.data.status ? sql`${tasksTable.status} = ${qp.data.status}` : undefined,
          qp.success && qp.data.priority ? sql`${tasksTable.priority} = ${qp.data.priority}` : undefined,
          qp.success && qp.data.projectId ? eq(tasksTable.projectId, qp.data.projectId) : undefined,
        )
      )
      .orderBy(tasksTable.createdAt);

    const rows = await query;
    res.json(rows.map(taskWithProject));
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks - create task
router.post("/", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [task] = await db
      .insert(tasksTable)
      .values({
        userId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        projectId: parsed.data.projectId ?? null,
        status: parsed.data.status ?? "todo",
        priority: parsed.data.priority ?? "medium",
        dueDate: parsed.data.dueDate ?? null,
      })
      .returning();

    await logActivity(userId, task.id, "created");

    let project: typeof projectsTable.$inferSelect | null = null;
    if (task.projectId) {
      const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId));
      project = p ?? null;
    }

    res.status(201).json(taskWithProject({ task, project }));
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/:id
router.get("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = GetTaskParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid task ID" }); return; }

  try {
    const [row] = await db
      .select({ task: tasksTable, project: projectsTable })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));

    if (!row) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(taskWithProject(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /tasks/:id
router.patch("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateTaskParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid task ID" }); return; }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const updateData: Partial<typeof tasksTable.$inferSelect> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description ?? null;
    if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId ?? null;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ?? null;

    const [task] = await db
      .update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, params.data.id))
      .returning();

    await logActivity(userId, task.id, "updated");

    let project: typeof projectsTable.$inferSelect | null = null;
    if (task.projectId) {
      const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId));
      project = p ?? null;
    }

    res.json(taskWithProject({ task, project }));
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /tasks/:id
router.delete("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = DeleteTaskParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid task ID" }); return; }

  try {
    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /tasks/:id/status
router.patch("/:id/status", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = UpdateTaskStatusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid task ID" }); return; }

  const parsed = UpdateTaskStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const [existing] = await db
      .select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    const [task] = await db
      .update(tasksTable)
      .set({ status: parsed.data.status })
      .where(eq(tasksTable.id, params.data.id))
      .returning();

    await logActivity(userId, task.id, `status changed to ${parsed.data.status}`);

    let project: typeof projectsTable.$inferSelect | null = null;
    if (task.projectId) {
      const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId));
      project = p ?? null;
    }

    res.json(taskWithProject({ task, project }));
  } catch (err) {
    req.log.error({ err }, "Failed to update task status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/:id/tasks
router.get("/projects/:id/tasks", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const params = ListProjectTasksParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: "Invalid project ID" }); return; }

  const qp = ListProjectTasksQueryParams.safeParse({
    status: req.query.status,
    priority: req.query.priority,
  });

  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Project not found" }); return; }

    const rows = await db
      .select({ task: tasksTable, project: projectsTable })
      .from(tasksTable)
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(
        and(
          eq(tasksTable.userId, userId),
          eq(tasksTable.projectId, params.data.id),
          qp.success && qp.data.status ? sql`${tasksTable.status} = ${qp.data.status}` : undefined,
          qp.success && qp.data.priority ? sql`${tasksTable.priority} = ${qp.data.priority}` : undefined,
        )
      )
      .orderBy(tasksTable.createdAt);

    res.json(rows.map(taskWithProject));
  } catch (err) {
    req.log.error({ err }, "Failed to list project tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

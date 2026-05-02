import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db, projectsTable, tasksTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  ListProjectTasksParams,
  ListProjectTasksQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const projects = await db
      .select({
        id: projectsTable.id,
        userId: projectsTable.userId,
        name: projectsTable.name,
        description: projectsTable.description,
        color: projectsTable.color,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
        taskCount: count(tasksTable.id),
        completedCount: sql<number>`count(case when ${tasksTable.status} = 'done' then 1 end)`,
      })
      .from(projectsTable)
      .leftJoin(tasksTable, eq(tasksTable.projectId, projectsTable.id))
      .where(eq(projectsTable.userId, userId))
      .groupBy(projectsTable.id)
      .orderBy(projectsTable.createdAt);

    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [project] = await db
      .insert(projectsTable)
      .values({ ...parsed.data, userId })
      .returning();

    res.status(201).json({ ...project, taskCount: 0, completedCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetProjectParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  try {
    const [project] = await db
      .select({
        id: projectsTable.id,
        userId: projectsTable.userId,
        name: projectsTable.name,
        description: projectsTable.description,
        color: projectsTable.color,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
        taskCount: count(tasksTable.id),
        completedCount: sql<number>`count(case when ${tasksTable.status} = 'done' then 1 end)`,
      })
      .from(projectsTable)
      .leftJoin(tasksTable, eq(tasksTable.projectId, projectsTable.id))
      .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, userId)))
      .groupBy(projectsTable.id);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateProjectParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [updated] = await db
      .update(projectsTable)
      .set(parsed.data)
      .where(eq(projectsTable.id, params.data.id))
      .returning();

    const [withCounts] = await db
      .select({
        id: projectsTable.id,
        userId: projectsTable.userId,
        name: projectsTable.name,
        description: projectsTable.description,
        color: projectsTable.color,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
        taskCount: count(tasksTable.id),
        completedCount: sql<number>`count(case when ${tasksTable.status} = 'done' then 1 end)`,
      })
      .from(projectsTable)
      .leftJoin(tasksTable, eq(tasksTable.projectId, projectsTable.id))
      .where(eq(projectsTable.id, updated.id))
      .groupBy(projectsTable.id);

    res.json(withCounts);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/tasks", requireAuth(), async (req, res): Promise<void> => {
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

    res.json(rows.map((row) => ({
      ...row.task,
      projectName: row.project?.name ?? null,
      projectColor: row.project?.color ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list project tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteProjectParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, userId)));

    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

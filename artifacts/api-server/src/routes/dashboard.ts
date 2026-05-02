import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db, tasksTable, projectsTable, activityTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [taskStats] = await db
      .select({
        totalTasks: count(),
        todoCount: sql<number>`count(case when ${tasksTable.status} = 'todo' then 1 end)`,
        inProgressCount: sql<number>`count(case when ${tasksTable.status} = 'in_progress' then 1 end)`,
        doneCount: sql<number>`count(case when ${tasksTable.status} = 'done' then 1 end)`,
        highPriorityCount: sql<number>`count(case when ${tasksTable.priority} = 'high' then 1 end)`,
        dueSoonCount: sql<number>`count(case when ${tasksTable.dueDate} <= (NOW() + INTERVAL '3 days') AND ${tasksTable.status} != 'done' then 1 end)`,
      })
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));

    const [projectStats] = await db
      .select({ totalProjects: count() })
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId));

    const totalTasks = Number(taskStats.totalTasks);
    const doneCount = Number(taskStats.doneCount);
    const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      todoCount: Number(taskStats.todoCount),
      inProgressCount: Number(taskStats.inProgressCount),
      doneCount,
      totalProjects: Number(projectStats.totalProjects),
      highPriorityCount: Number(taskStats.highPriorityCount),
      dueSoonCount: Number(taskStats.dueSoonCount),
      completionRate,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity", requireAuth(), async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const rows = await db
      .select({
        id: activityTable.id,
        taskId: activityTable.taskId,
        taskTitle: tasksTable.title,
        action: activityTable.action,
        projectName: projectsTable.name,
        projectColor: projectsTable.color,
        createdAt: activityTable.createdAt,
      })
      .from(activityTable)
      .innerJoin(tasksTable, eq(activityTable.taskId, tasksTable.id))
      .leftJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
      .where(eq(activityTable.userId, userId))
      .orderBy(sql`${activityTable.createdAt} desc`)
      .limit(20);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;

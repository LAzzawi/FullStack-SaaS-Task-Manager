import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  useCreateTask,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/sidebar";
import { CheckSquare, Clock, AlertTriangle, Layers, TrendingUp, Activity, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number | string; icon: React.ComponentType<{ className?: string }>;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ActivityItem({ item }: { item: { id: number; taskTitle: string; action: string; projectName?: string | null; projectColor?: string | null; createdAt: string } }) {
  const date = new Date(item.createdAt);
  const timeAgo = formatTimeAgo(date);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-medium">{item.taskTitle}</span>
          <span className="text-muted-foreground"> was {item.action}</span>
        </p>
        {item.projectName && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.projectColor ?? "#6366f1" }} />
            <span className="text-xs text-muted-foreground">{item.projectName}</span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const createTask = useCreateTask();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your workspace at a glance</p>
            </div>
            <Button data-testid="button-add-task" size="sm" className="gap-2" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="w-4 h-4" /> New task
            </Button>
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total tasks" value={summary.totalTasks} icon={CheckSquare} color="bg-primary/10 text-primary" />
              <StatCard label="In progress" value={summary.inProgressCount} icon={Clock} color="bg-blue-50 text-blue-600" sub={`${summary.todoCount} todo`} />
              <StatCard label="High priority" value={summary.highPriorityCount} icon={AlertTriangle} color="bg-red-50 text-red-600" sub={`${summary.dueSoonCount} due soon`} />
              <StatCard label="Completion" value={`${summary.completionRate}%`} icon={TrendingUp} color="bg-green-50 text-green-600" sub={`${summary.doneCount} done`} />
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Recent activity</h2>
              </div>
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : activity && activity.length > 0 ? (
                <div>{activity.slice(0, 10).map((a) => <ActivityItem key={a.id} item={a} />)}</div>
              ) : (
                <div className="py-10 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No activity yet. Start by creating a task.</p>
                </div>
              )}
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Overview</h2>
              </div>
              {summaryLoading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : summary ? (
                <div className="space-y-3">
                  {[
                    { label: "Todo", count: summary.todoCount, color: "bg-slate-400", total: summary.totalTasks },
                    { label: "In progress", count: summary.inProgressCount, color: "bg-blue-500", total: summary.totalTasks },
                    { label: "Done", count: summary.doneCount, color: "bg-green-500", total: summary.totalTasks },
                  ].map(({ label, count, color, total }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", color)}
                          style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Projects</span>
                      <span className="font-medium text-foreground">{summary.totalProjects}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        }}
      />
    </div>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTasks,
  getListTasksQueryKey,
  useDeleteTask,
  useUpdateTaskStatus,
  useListProjects,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, CheckSquare, Trash2, Pencil, ChevronDown, Circle, CheckCircle2, Clock,
} from "lucide-react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  todo: { label: "Todo", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Circle },
  in_progress: { label: "In progress", color: "bg-blue-100 text-blue-600 border-blue-200", icon: Clock },
  done: { label: "Done", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
};
const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-slate-100 text-slate-500 border-slate-200" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
  high: { label: "High", color: "bg-red-100 text-red-600 border-red-200" },
};

type Task = {
  id: number; title: string; description: string | null;
  projectId: number | null; projectName: string | null; projectColor: string | null;
  status: "todo" | "in_progress" | "done"; priority: "low" | "medium" | "high";
  dueDate: string | null; createdAt: string; updatedAt: string; userId: string;
};

function TaskRow({ task, onEdit, onDelete, onStatusChange }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: "todo" | "in_progress" | "done") => void;
}) {
  const status = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];
  const StatusIcon = status.icon;
  const nextStatus = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";

  return (
    <div data-testid={`row-task-${task.id}`} className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
      <button
        data-testid={`button-toggle-status-${task.id}`}
        onClick={() => onStatusChange(task.id, nextStatus)}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        title={`Mark as ${nextStatus}`}
      >
        <StatusIcon className={cn("w-5 h-5", task.status === "done" ? "text-green-600" : task.status === "in_progress" ? "text-blue-500" : "")} />
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium text-foreground truncate", task.status === "done" && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {task.projectName && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.projectColor ?? "#6366f1" }} />
            <span className="text-xs text-muted-foreground">{task.projectName}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.dueDate && (
          <span className="text-xs text-muted-foreground hidden sm:block">{task.dueDate}</span>
        )}
        <Badge variant="outline" className={cn("text-xs border px-2 py-0.5 font-medium", priority.color)}>
          {priority.label}
        </Badge>
        <Badge variant="outline" className={cn("text-xs border px-2 py-0.5 font-medium hidden md:flex", status.color)}>
          {status.label}
        </Badge>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button data-testid={`button-edit-task-${task.id}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button data-testid={`button-delete-task-${task.id}`} variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const params = {
    status: statusFilter !== "all" ? statusFilter as "todo" | "in_progress" | "done" : undefined,
    priority: priorityFilter !== "all" ? priorityFilter as "low" | "medium" | "high" : undefined,
    projectId: projectFilter !== "all" ? parseInt(projectFilter) : undefined,
  };

  const { data: tasks, isLoading } = useListTasks(params);
  const { data: projects } = useListProjects();
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => { toast({ title: "Task deleted" }); invalidate(); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleStatusChange = (id: number, status: "todo" | "in_progress" | "done") => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {tasks ? `${tasks.length} task${tasks.length !== 1 ? "s" : ""}` : "All your tasks"}
              </p>
            </div>
            <Button data-testid="button-new-task" size="sm" className="gap-2" onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> New task
            </Button>
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status" className="w-36 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="filter-priority" className="w-36 h-8 text-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            {projects && projects.length > 0 && (
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger data-testid="filter-project" className="w-40 h-8 text-sm">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoading ? (
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 border-b border-border rounded-none" />)}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              {(tasks as Task[]).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={(t) => { setEditingTask(t); setDialogOpen(true); }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No tasks found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter !== "all" || priorityFilter !== "all" ? "Try adjusting your filters" : "Create your first task to get started"}
              </p>
              {statusFilter === "all" && priorityFilter === "all" && (
                <Button data-testid="button-create-first-task" onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" /> Create task
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask ?? undefined}
        onSuccess={invalidate}
      />
    </div>
  );
}

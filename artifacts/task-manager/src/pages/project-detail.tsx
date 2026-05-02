import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProject,
  getGetProjectQueryKey,
  useListProjectTasks,
  getListProjectTasksQueryKey,
  useDeleteTask,
  useUpdateTaskStatus,
  useDeleteProject,
  getListProjectsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, FolderOpen, Trash2, Pencil, Circle, CheckCircle2, Clock, Settings2 } from "lucide-react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { ProjectDialog } from "@/components/projects/project-dialog";
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

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });
  const qpStatus = statusFilter !== "all" ? { status: statusFilter as "todo" | "in_progress" | "done" } : {};
  const { data: tasks, isLoading: tasksLoading } = useListProjectTasks(projectId, qpStatus, {
    query: { enabled: !!projectId, queryKey: getListProjectTasksQueryKey(projectId, qpStatus) },
  });

  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteProject = useDeleteProject();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId, {}) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  };

  const handleDeleteTask = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => { toast({ title: "Task deleted" }); invalidate(); },
      onError: () => toast({ title: "Failed to delete task", variant: "destructive" }),
    });
  };

  const handleStatusChange = (id: number, status: "todo" | "in_progress" | "done") => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  const handleDeleteProject = () => {
    if (!project) return;
    deleteProject.mutate({ id: project.id }, {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation("/projects");
      },
      onError: () => toast({ title: "Failed to delete project", variant: "destructive" }),
    });
  };

  const progress = project && project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            data-testid="button-back-to-projects"
            onClick={() => setLocation("/projects")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to projects
          </button>

          {projectLoading ? (
            <div className="mb-8"><Skeleton className="h-10 w-60 mb-2" /><Skeleton className="h-2 w-full rounded-full" /></div>
          ) : project ? (
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: project.color + "20" }}>
                    <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                    {project.description && <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button data-testid="button-edit-project" variant="outline" size="sm" className="gap-2" onClick={() => setProjectDialogOpen(true)}>
                    <Settings2 className="w-4 h-4" /> Edit
                  </Button>
                  <Button data-testid="button-delete-project" variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDeleteProject}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {project.completedCount}/{project.taskCount} done
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status" className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-add-task" size="sm" className="gap-2" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
              <Plus className="w-4 h-4" /> Add task
            </Button>
          </div>

          {tasksLoading ? (
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 border-b border-border rounded-none" />)}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              {(tasks as Task[]).map((task) => {
                const status = STATUS_CONFIG[task.status];
                const priority = PRIORITY_CONFIG[task.priority];
                const StatusIcon = status.icon;
                const nextStatus = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
                return (
                  <div key={task.id} data-testid={`row-task-${task.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
                    <button data-testid={`button-toggle-status-${task.id}`} onClick={() => handleStatusChange(task.id, nextStatus)} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                      <StatusIcon className={cn("w-5 h-5", task.status === "done" ? "text-green-600" : task.status === "in_progress" ? "text-blue-500" : "")} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium text-foreground truncate", task.status === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.dueDate && <span className="text-xs text-muted-foreground hidden sm:block">{task.dueDate}</span>}
                      <Badge variant="outline" className={cn("text-xs border px-2 py-0.5 font-medium", priority.color)}>{priority.label}</Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button data-testid={`button-edit-task-${task.id}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(task); setTaskDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button data-testid={`button-delete-task-${task.id}`} variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground mb-3">No tasks in this project yet</p>
              <Button data-testid="button-create-first-task" onClick={() => setTaskDialogOpen(true)} className="gap-2" size="sm">
                <Plus className="w-4 h-4" /> Add first task
              </Button>
            </div>
          )}
        </div>
      </main>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => { setTaskDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask ?? undefined}
        defaultProjectId={projectId}
        onSuccess={invalidate}
      />
      {project && (
        <ProjectDialog
          open={projectDialogOpen}
          onOpenChange={setProjectDialogOpen}
          project={{ ...project, description: project.description ?? null }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          }}
        />
      )}
    </div>
  );
}

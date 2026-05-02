import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  getListProjectsQueryKey,
  useCreateProject,
  useDeleteProject,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, ArrowRight, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { useToast } from "@/hooks/use-toast";

const PROJECT_COLORS = ["#4F46E5","#7C3AED","#DB2777","#059669","#D97706","#0284C7","#EA580C","#EC4899"];

function ProjectCard({ project, onDelete }: {
  project: { id: number; name: string; description?: string | null; color: string; taskCount: number; completedCount: number };
  onDelete: (id: number) => void;
}) {
  const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;

  return (
    <div data-testid={`card-project-${project.id}`} className="bg-card border border-card-border rounded-xl p-5 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + "20" }}>
            <FolderOpen className="w-4.5 h-4.5" style={{ color: project.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid={`button-project-menu-${project.id}`} variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              data-testid={`button-delete-project-${project.id}`}
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{project.completedCount}/{project.taskCount} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
        </div>
      </div>

      <Link href={`/projects/${project.id}`}>
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer pt-1">
          View tasks <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useListProjects();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const deleteProject = useDeleteProject();

  const handleDelete = (id: number) => {
    deleteProject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project deleted" });
      },
      onError: () => toast({ title: "Failed to delete project", variant: "destructive" }),
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {projects ? `${projects.length} project${projects.length !== 1 ? "s" : ""}` : "Organize your work"}
              </p>
            </div>
            <Button data-testid="button-new-project" size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" /> New project
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a project to organize your tasks</p>
              <Button data-testid="button-create-first-project" onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create project
              </Button>
            </div>
          )}
        </div>
      </main>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })}
      />
    </div>
  );
}

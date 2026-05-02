import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateTask,
  useUpdateTask,
  useListProjects,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  task?: {
    id: number; title: string; description: string | null;
    projectId: number | null; status: string; priority: string; dueDate: string | null;
  };
  defaultProjectId?: number;
}

export function TaskDialog({ open, onOpenChange, onSuccess, task, defaultProjectId }: TaskDialogProps) {
  const { toast } = useToast();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projects } = useListProjects();
  const isEdit = !!task;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId?.toString() ?? defaultProjectId?.toString() ?? "none",
      status: (task?.status as FormValues["status"]) ?? "todo",
      priority: (task?.priority as FormValues["priority"]) ?? "medium",
      dueDate: task?.dueDate ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const data = {
      title: values.title,
      description: values.description || null,
      projectId: values.projectId && values.projectId !== "none" ? parseInt(values.projectId) : null,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
    };

    if (isEdit) {
      updateTask.mutate({ id: task.id, data }, {
        onSuccess: () => {
          toast({ title: "Task updated" });
          onOpenChange(false);
          onSuccess?.();
        },
        onError: () => toast({ title: "Failed to update task", variant: "destructive" }),
      });
    } else {
      createTask.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Task created" });
          onOpenChange(false);
          onSuccess?.();
          form.reset({ title: "", description: "", projectId: defaultProjectId?.toString() ?? "none", status: "todo", priority: "medium", dueDate: "" });
        },
        onError: () => toast({ title: "Failed to create task", variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input data-testid="input-task-title" placeholder="What needs to be done?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea data-testid="input-task-description" placeholder="Add more details..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="projectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-task-project">
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input data-testid="input-task-due-date" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button data-testid="button-cancel-task" type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                data-testid="button-submit-task"
                type="submit"
                className="flex-1"
                disabled={createTask.isPending || updateTask.isPending}
              >
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProject, useUpdateProject } from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#4F46E5","#7C3AED","#DB2777","#059669","#D97706","#0284C7","#EA580C","#EC4899",
];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().optional(),
  color: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  project?: { id: number; name: string; description: string | null; color: string };
}

export function ProjectDialog({ open, onOpenChange, onSuccess, project }: ProjectDialogProps) {
  const { toast } = useToast();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEdit = !!project;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      color: project?.color ?? PROJECT_COLORS[0],
    },
  });

  const onSubmit = (values: FormValues) => {
    const data = { name: values.name, description: values.description || null, color: values.color };
    if (isEdit) {
      updateProject.mutate({ id: project.id, data }, {
        onSuccess: () => {
          toast({ title: "Project updated" });
          onOpenChange(false);
          onSuccess?.();
          form.reset();
        },
        onError: () => toast({ title: "Failed to update project", variant: "destructive" }),
      });
    } else {
      createProject.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Project created" });
          onOpenChange(false);
          onSuccess?.();
          form.reset({ name: "", description: "", color: PROJECT_COLORS[0] });
        },
        onError: () => toast({ title: "Failed to create project", variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input data-testid="input-project-name" placeholder="Project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea data-testid="input-project-description" placeholder="What's this project about?" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        data-testid={`button-color-${color.replace("#", "")}`}
                        onClick={() => field.onChange(color)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          field.value === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 pt-1">
              <Button data-testid="button-cancel-project" type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                data-testid="button-submit-project"
                type="submit"
                className="flex-1"
                disabled={createProject.isPending || updateProject.isPending}
              >
                {isEdit ? "Save changes" : "Create project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

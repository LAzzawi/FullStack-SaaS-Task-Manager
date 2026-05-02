import { Link } from "wouter";
import { CheckSquare, Zap, FolderOpen, BarChart3, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: FolderOpen, title: "Organize by Project", desc: "Group tasks into projects with color coding and progress tracking." },
  { icon: CheckSquare, title: "Task Management", desc: "Create, prioritize, and track tasks with statuses and due dates." },
  { icon: BarChart3, title: "Dashboard Overview", desc: "See your progress at a glance with summary stats and activity feeds." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground text-base">Taskflow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button data-testid="button-sign-in" variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button data-testid="button-sign-up" size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6 border border-accent-border">
            <Zap className="w-3 h-3" />
            Built for focused teams
          </div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-tight mb-5">
            Work that moves.<br />
            <span className="text-primary">Tasks that stick.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Taskflow is a lean, fast task manager for people who want to actually get things done — not spend time organizing their organizer.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button data-testid="button-get-started" size="lg" className="gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button data-testid="button-sign-in-hero" variant="outline" size="lg">Sign in</Button>
            </Link>
          </div>
        </section>

        <section className="px-6 py-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-card-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-16 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Simple, not simplistic</h2>
          <p className="text-muted-foreground mb-8">Everything you need to ship. Nothing you don't.</p>
          <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto mb-8">
            {["Project organization", "Priority levels", "Due dates", "Status tracking", "Activity feed", "Dashboard stats"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <Link href="/sign-up">
            <Button data-testid="button-cta-bottom" size="lg">Create your workspace</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        <p>Taskflow — built for focus.</p>
      </footer>
    </div>
  );
}

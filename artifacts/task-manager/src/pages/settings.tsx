import { useUser, useClerk } from "@clerk/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Calendar } from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your account</p>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-5">Profile</h2>
            {!isLoaded ? (
              <div className="animate-pulse space-y-3">
                <div className="h-14 w-14 rounded-full bg-muted" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-60 bg-muted rounded" />
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p data-testid="text-user-name" className="font-semibold text-foreground text-lg">
                      {user.fullName ?? "No name set"}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
                  </div>
                </div>
                <div>
                  <InfoRow icon={User} label="Full name" value={user.fullName ?? "Not set"} />
                  <InfoRow icon={Mail} label="Email address" value={user.emailAddresses[0]?.emailAddress ?? ""} />
                  {joinedDate && <InfoRow icon={Calendar} label="Member since" value={joinedDate} />}
                </div>
              </>
            ) : null}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sign out of your account on this device</p>
              </div>
              <Button
                data-testid="button-sign-out"
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { updateProfileAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getProfileQueueSummary,
  type AdminProfileListItem,
} from "@/lib/admin/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";
import { Check, Crown, RotateCcw, Trash2, X } from "lucide-react";

export default async function AdminPage() {
  const profile = await requireAdmin();
  const profiles = await getAdminProfiles();
  const summary = getProfileQueueSummary(profiles);

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:py-10">
        <header className="flex flex-col gap-4 border-b border-border pb-7">
          <Badge className="w-fit border-primary/40 bg-primary/10 text-primary" variant="outline">
            Admin console
          </Badge>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                User management
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {profile.display_name} can approve access requests, reject accounts,
                soft-delete users, restore users, and toggle premium access.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")} href="/admin/bugs">
                Bug Reports
              </Link>
              <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                Last active admin is protected by the database trigger.
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SummaryCard label="Total" value={summary.total} />
          <SummaryCard label="Pending" value={summary.pending} />
          <SummaryCard label="Approved" value={summary.approved} />
          <SummaryCard label="Rejected" value={summary.rejected} />
          <SummaryCard label="Deleted" value={summary.deleted} />
          <SummaryCard label="Premium" value={summary.premium} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Profiles</h2>
            <span className="text-sm text-muted-foreground">
              Newest first · {profiles.length} visible
            </span>
          </div>
          <div className="grid gap-3">
            {profiles.map((managedProfile) => (
              <Card key={managedProfile.id} className="rounded-lg bg-card/92">
                <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge profile={managedProfile} />
                      {managedProfile.role === "admin" ? (
                        <Badge className="border-primary/40 text-primary" variant="outline">
                          admin
                        </Badge>
                      ) : null}
                      {managedProfile.is_premium ? (
                        <Badge className="border-emerald-500/35 text-emerald-200" variant="outline">
                          premium
                        </Badge>
                      ) : null}
                      {managedProfile.email_confirmed ? (
                        <Badge variant="secondary">email confirmed</Badge>
                      ) : (
                        <Badge className="border-amber-500/35 text-amber-200" variant="outline">
                          email pending
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-3 text-xl">{managedProfile.display_name}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {managedProfile.email ?? "No auth email found"} · {managedProfile.id}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {formatDate(managedProfile.created_at)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <AdminActionButton
                    action="approve"
                    icon={<Check className="size-4" aria-hidden="true" />}
                    label="Approve"
                    profile={managedProfile}
                  />
                  <AdminActionButton
                    action="reject"
                    icon={<X className="size-4" aria-hidden="true" />}
                    label="Reject"
                    profile={managedProfile}
                    variant="destructive"
                  />
                  {managedProfile.is_deleted ? (
                    <AdminActionButton
                      action="restore"
                      icon={<RotateCcw className="size-4" aria-hidden="true" />}
                      label="Restore"
                      profile={managedProfile}
                    />
                  ) : (
                    <AdminActionButton
                      action="deactivate"
                      icon={<Trash2 className="size-4" aria-hidden="true" />}
                      label="Deactivate"
                      profile={managedProfile}
                      variant="destructive"
                    />
                  )}
                  <AdminActionButton
                    action="toggle_premium"
                    icon={<Crown className="size-4" aria-hidden="true" />}
                    label={managedProfile.is_premium ? "Remove premium" : "Grant premium"}
                    premiumValue={!managedProfile.is_premium}
                    profile={managedProfile}
                    variant="outline"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-lg bg-card/92">
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ profile }: { profile: AdminProfileListItem }) {
  if (profile.is_deleted) {
    return <Badge variant="destructive">deleted</Badge>;
  }

  if (profile.approval_status === "approved") {
    return (
      <Badge className="border-emerald-500/35 bg-emerald-500/10 text-emerald-200" variant="outline">
        approved
      </Badge>
    );
  }

  if (profile.approval_status === "rejected") {
    return <Badge variant="destructive">rejected</Badge>;
  }

  return <Badge className="border-amber-500/35 text-amber-200" variant="outline">pending</Badge>;
}

function AdminActionButton({
  action,
  icon,
  label,
  premiumValue,
  profile,
  variant = "secondary",
}: {
  action: string;
  icon: React.ReactNode;
  label: string;
  premiumValue?: boolean;
  profile: AdminProfileListItem;
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  return (
    <form action={updateProfileAction}>
      <input name="profile_id" type="hidden" value={profile.id} />
      <input name="action" type="hidden" value={action} />
      {typeof premiumValue === "boolean" ? (
        <input name="premium_value" type="hidden" value={String(premiumValue)} />
      ) : null}
      <Button size="sm" type="submit" variant={variant}>
        {icon}
        {label}
      </Button>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

async function getAdminProfiles(): Promise<AdminProfileListItem[]> {
  const supabase = createAdminSupabaseClient();
  const [{ data: profiles, error: profilesError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,display_name,role,approval_status,is_deleted,is_premium,created_at,updated_at,approved_at,rejected_at,deleted_at",
        )
        .order("created_at", { ascending: false }),
      supabase.auth.admin.listUsers({ page: 1, perPage: 100 }),
    ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  if (usersError) {
    throw new Error(usersError.message);
  }

  const usersById = new Map(
    users.users.map((user) => [
      user.id,
      {
        email: user.email ?? null,
        email_confirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
      },
    ]),
  );

  return (profiles ?? []).map((profile) => {
    const user = usersById.get(profile.id);

    return {
      ...profile,
      email: user?.email ?? null,
      email_confirmed: user?.email_confirmed ?? false,
    };
  });
}

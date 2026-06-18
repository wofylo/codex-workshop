import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPage() {
  const profile = await requireAdmin();

  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-6 text-foreground">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Admin</p>
      <h1 className="mt-4 text-4xl font-semibold">Admin access verified</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {profile.display_name} can enter admin-only routes. User management and
        question management arrive in later phases.
      </p>
    </main>
  );
}

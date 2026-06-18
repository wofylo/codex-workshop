import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireApprovedUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const profile = await requireApprovedUser();

  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-6 text-foreground">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
        Study cockpit
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Welcome, {profile.display_name}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Your approved account can enter protected app routes. Study guides,
        quizzes, and progress arrive in later phases.
      </p>
      <form action={logoutAction} className="mt-8">
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}

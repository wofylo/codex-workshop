import Link from "next/link";

export default function DeactivatedPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">Account deactivated</h1>
      <p className="mt-4 text-muted-foreground">
        This account is no longer active and cannot access the app.
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

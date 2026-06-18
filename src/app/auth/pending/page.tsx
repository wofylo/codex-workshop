import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">Approval pending</h1>
      <p className="mt-4 text-muted-foreground">
        Your account request was received. An admin must approve it before you can
        enter the study cockpit.
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

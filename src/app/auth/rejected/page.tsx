import Link from "next/link";

export default function RejectedPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">Access not approved</h1>
      <p className="mt-4 text-muted-foreground">
        This account request was rejected. Contact an admin if you believe this is
        incorrect.
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

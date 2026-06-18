import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">Verify your email</h1>
      <p className="mt-4 text-muted-foreground">
        Confirm your email address, then sign in again. App approval is separate
        from email verification.
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

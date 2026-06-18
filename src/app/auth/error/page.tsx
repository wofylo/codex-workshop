import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">Authentication problem</h1>
      <p className="mt-4 text-muted-foreground">
        The request could not be completed. Check your details and try again.
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

import Link from "next/link";
import { getAuthErrorCopy } from "@/lib/auth/error-copy";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{
    reason?: string;
  }>;
}) {
  const { reason } = await searchParams;
  const copy = getAuthErrorCopy(reason ?? null);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground">
      <h1 className="text-3xl font-semibold">{copy.title}</h1>
      <p className="mt-4 text-muted-foreground">
        {copy.message}
      </p>
      <Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">
        Return to sign in
      </Link>
    </main>
  );
}

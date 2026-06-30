import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email and password from your access request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Password</span>
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <Button className="w-full" type="submit" size="lg">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Need access?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/auth/sign-up">
              Request an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

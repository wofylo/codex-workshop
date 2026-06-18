import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Request access</CardTitle>
          <CardDescription>
            Create an account for admin approval before entering the study cockpit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpAction} className="space-y-4">
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
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Display name</span>
              <input
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                name="display_name"
                minLength={3}
                maxLength={40}
                autoComplete="nickname"
                required
              />
            </label>
            <label className="flex gap-3 text-sm text-muted-foreground">
              <input className="mt-1" name="public_consent" type="checkbox" required />
              <span>
                I understand my display name, progress summary, and leaderboard score
                will be visible to approved users.
              </span>
            </label>
            <Button className="w-full" type="submit" size="lg">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already approved?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/auth/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

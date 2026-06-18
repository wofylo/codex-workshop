import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BookOpenCheck, Crown, Gauge, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const foundationItems = [
  {
    label: "Study cockpit",
    detail: "Dark workspace for domain progress and review focus.",
    icon: BookOpenCheck,
  },
  {
    label: "Deployment path",
    detail: "GitHub Actions and Vercel production branch are defined.",
    icon: Gauge,
  },
  {
    label: "Security boundary",
    detail: "Public and server-only Supabase clients are separated.",
    icon: ShieldCheck,
  },
  {
    label: "Premium-ready",
    detail: "Gold accent system is reserved for premium and key actions.",
    icon: Crown,
  },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-6 py-16">
        <Badge className="w-fit border-primary/40 bg-primary/10 text-primary" variant="outline">
          CCA-F Exam Prep
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          A dark scholarly command center for certification study.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          The deployable foundation is live with Supabase-backed access requests,
          approved-user gates, and admin route protection.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")} href="/auth/login">
            Sign in
          </Link>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto")}
            href="/auth/sign-up"
          >
            Request access
          </Link>
        </div>
        <Separator className="my-8 bg-border" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {foundationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="rounded-lg border-border bg-card/92">
                <CardHeader className="space-y-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription>{item.detail}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Ready for protected workflow implementation.
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}

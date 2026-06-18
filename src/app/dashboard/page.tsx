import { logoutAction } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import {
  getDashboardSummary,
  getStudyDomains,
  getSuggestedDomain,
} from "@/lib/study/dashboard";
import { ArrowRight, BookOpenCheck, Crown, FileText, Gauge, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await requireApprovedUser();
  const domains = getStudyDomains();
  const summary = getDashboardSummary();
  const suggestedDomain = getSuggestedDomain();
  const isAdmin = profile.role === "admin";

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:py-10">
        <header className="flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/40 bg-primary/10 text-primary" variant="outline">
                Study cockpit
              </Badge>
              {isAdmin ? (
                <Badge className="border-emerald-500/35 bg-emerald-500/10 text-emerald-200" variant="outline">
                  Admin verified
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
              Welcome, {profile.display_name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Your CCA-F workspace is organized around the exam weightings. Start
              with the heaviest scenario domains, then use the bilingual guides
              for focused review.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAdmin ? (
              <Link className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")} href="/admin">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Admin
              </Link>
            ) : null}
            <form action={logoutAction}>
              <Button className="w-full sm:w-auto" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Card className="rounded-lg border-primary/35 bg-primary/10">
            <CardHeader>
              <CardDescription>Recommended next</CardDescription>
              <CardTitle className="text-xl">{suggestedDomain.shortTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
              <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{suggestedDomain.nextAction}</span>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardDescription>Coverage map</CardDescription>
              <CardTitle className="text-xl">{summary.domainCount} domains</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
              <Gauge className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{summary.totalExamWeight}% exam weighting represented.</span>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardDescription>Reference library</CardDescription>
              <CardTitle className="text-xl">{summary.guideCount} guides</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>English and Traditional Chinese notes are tracked for each domain.</span>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Exam domains</h2>
              <span className="text-sm text-muted-foreground">Ordered by study priority</span>
            </div>
            <div className="grid gap-3">
              {domains.map((domain) => (
                <Card key={domain.slug} className="rounded-lg bg-card/92">
                  <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Domain {domain.order}</Badge>
                        <Badge className="border-primary/40 text-primary" variant="outline">
                          {domain.weight}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">{domain.questionEstimate}</span>
                      </div>
                      <CardTitle className="mt-3 text-lg leading-6">{domain.title}</CardTitle>
                      <CardDescription className="mt-2 leading-6">{domain.focus}</CardDescription>
                    </div>
                    <div className="shrink-0 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                      {domain.difficulty}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="rounded-md border border-border bg-background/45 p-3">
                      <div className="mb-1 font-medium text-foreground">Next action</div>
                      {domain.nextAction}
                    </div>
                    <div className="rounded-md border border-border bg-background/45 p-3">
                      <div className="mb-1 font-medium text-foreground">Guides</div>
                      <div className="space-y-1 font-mono text-xs">
                        <div>{domain.englishGuide}</div>
                        <div>{domain.chineseGuide}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-3">
            <Card className="rounded-lg border-primary/30 bg-card/92">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="size-4 text-primary" aria-hidden="true" />
                  Pass strategy
                </CardTitle>
                <CardDescription>Domain 1 and Domain 2 are 47% of the score.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Prioritize architecture scenarios first, then Claude Code configuration.
                  Use the lower-weight domains to stabilize recall after the hard material.
                </p>
                <div className="rounded-md border border-border bg-background/45 p-3 text-foreground">
                  Target: 720 / 1000
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg bg-card/92">
              <CardHeader>
                <CardTitle className="text-lg">What is next</CardTitle>
                <CardDescription>Planned app slices after this dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Admin user management for approvals and premium flags.</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Study reading pages with rendered guide content.</span>
                </div>
                <div className="flex gap-2">
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Progress tracking once the schema is ready.</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Circle, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setSectionReadAction } from "@/app/study/[domainSlug]/actions";
import { requireApprovedUser } from "@/lib/auth/guards";
import {
  getStudyContent,
  getStudyDomainSlugs,
  type MarkdownBlock,
  type StudyLanguage,
  type StudySection,
} from "@/lib/study/content";
import {
  buildStudyProgressState,
  type StudyProgressRow,
  type StudyProgressState,
} from "@/lib/study/progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type StudyPageProps = {
  params: Promise<{
    domainSlug: string;
  }>;
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export function generateStaticParams() {
  return getStudyDomainSlugs().map((domainSlug) => ({ domainSlug }));
}

export default async function StudyDomainPage({ params, searchParams }: StudyPageProps) {
  const profile = await requireApprovedUser();

  const { domainSlug } = await params;
  const query = await searchParams;
  const language: StudyLanguage = query?.lang === "zh" ? "zh" : "en";
  const alternateLanguage: StudyLanguage = language === "en" ? "zh" : "en";
  const content = getStudyContent(domainSlug, language);

  if (!content) {
    notFound();
  }

  const progressRows = await getStudyProgressRows(
    profile.id,
    content.domain.slug,
    content.language,
  );
  const progressState = buildStudyProgressState(content.sections, progressRows);

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link className={cn(buttonVariants({ variant: "outline" }), "h-8")} href="/dashboard">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "h-8")}
              href={`/study/${content.domain.slug}?lang=${alternateLanguage}`}
            >
              <Languages className="size-4" aria-hidden="true" />
              {alternateLanguage === "zh" ? "中文" : "English"}
            </Link>
          </div>

          {content.sections.length > 0 ? (
            <div className="mb-5 rounded-lg border border-border bg-card/92 p-4 lg:hidden">
              <h2 className="text-sm font-semibold tracking-normal">Sections</h2>
              <ProgressSummary progressState={progressState} />
              <div className="mt-3">
                <StudySectionNavigation
                  domainSlug={content.domain.slug}
                  language={content.language}
                  progressState={progressState}
                  sections={content.sections}
                />
              </div>
            </div>
          ) : null}

          <article className="rounded-lg border border-border bg-card/92 px-5 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:px-8">
            <header className="border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/40 bg-primary/10 text-primary" variant="outline">
                  Domain {content.domain.order}
                </Badge>
                <Badge variant="secondary">{content.domain.weight}% weight</Badge>
                <Badge variant="outline">{content.language === "zh" ? "Traditional Chinese" : "English"}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                {content.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {content.domain.focus}
              </p>
            </header>

            <div className="mt-7 space-y-5">
              {content.blocks.slice(1).map((block, index) => (
                <MarkdownBlockView block={block} key={`${block.type}-${index}`} />
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <Card className="rounded-lg border-primary/30 bg-card/92">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpenCheck className="size-4 text-primary" aria-hidden="true" />
                Study focus
              </CardTitle>
              <CardDescription>{content.domain.difficulty}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>{content.domain.nextAction}</p>
              <div className="rounded-md border border-border bg-background/45 p-3 font-mono text-xs">
                {content.sourcePath}
              </div>
            </CardContent>
          </Card>

          {content.sections.length > 0 ? (
            <Card className="hidden rounded-lg bg-card/92 lg:block">
            <CardHeader>
              <CardTitle className="text-lg">Sections</CardTitle>
              <CardDescription>Jump within this guide.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProgressSummary progressState={progressState} />
                <div className="mt-3">
                  <StudySectionNavigation
                    domainSlug={content.domain.slug}
                    language={content.language}
                    progressState={progressState}
                    sections={content.sections}
                  />
                </div>
            </CardContent>
          </Card>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

async function getStudyProgressRows(
  userId: string,
  domainSlug: string,
  language: StudyLanguage,
): Promise<StudyProgressRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("study_progress")
    .select("section_id, section_title, is_read, read_at")
    .eq("user_id", userId)
    .eq("domain_slug", domainSlug)
    .eq("language", language);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function ProgressSummary({ progressState }: { progressState: StudyProgressState }) {
  const { percentage, readSections, totalSections } = progressState.summary;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{readSections} / {totalSections} read</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StudySectionNavigation({
  domainSlug,
  language,
  progressState,
  sections,
}: {
  domainSlug: string;
  language: StudyLanguage;
  progressState: StudyProgressState;
  sections: StudySection[];
}) {
  return (
    <nav aria-label="Study sections" className="space-y-1">
      {sections.map((section) => {
        const progress = progressState.bySectionId[section.id];
        const isRead = progress?.isRead === true;

        return (
          <div
            className={cn(
              "grid grid-cols-[1fr_auto] items-center gap-2 rounded-md",
              section.depth === 3 && "ml-3",
            )}
            key={section.id}
          >
            <Link
              className={cn(
                "block rounded-md px-2 py-1.5 text-sm leading-5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                section.depth === 3 && "text-xs",
                isRead && "text-muted-foreground/70 line-through decoration-muted-foreground/40",
              )}
              href={`#${section.id}`}
            >
              {section.title}
            </Link>
            <form action={setSectionReadAction}>
              <input name="domain_slug" type="hidden" value={domainSlug} />
              <input name="language" type="hidden" value={language} />
              <input name="section_id" type="hidden" value={section.id} />
              <input name="read" type="hidden" value={isRead ? "false" : "true"} />
              <button
                aria-label={`Mark ${section.title} as ${isRead ? "unread" : "read"}`}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isRead && "text-primary",
                )}
                type="submit"
              >
                {isRead ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <Circle className="size-4" aria-hidden="true" />
                )}
              </button>
            </form>
          </div>
        );
      })}
    </nav>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const Tag = block.depth === 1 ? "h1" : block.depth === 2 ? "h2" : "h3";
    const className =
      block.depth === 2
        ? "scroll-mt-24 pt-3 text-2xl font-semibold tracking-normal"
        : "scroll-mt-24 pt-2 text-xl font-semibold tracking-normal";

    return (
      <Tag className={className} id={block.anchor}>
        {block.text}
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return <p className="text-sm leading-7 text-muted-foreground sm:text-base">{block.text}</p>;
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-primary/60 pl-4 text-sm leading-7 text-secondary-foreground">
        {block.text}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";

    return (
      <ListTag className="ml-5 space-y-2 text-sm leading-7 text-muted-foreground sm:text-base">
        {block.items.map((item, index) => (
          <li className={block.ordered ? "list-decimal" : "list-disc"} key={`${item}-${index}`}>
            {item}
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-md border border-border bg-background/70 p-4 text-xs leading-6 text-secondary-foreground">
        <code>{block.text}</code>
      </pre>
    );
  }

  return <div className="h-px bg-border" />;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import {
  getStudyContent,
  getStudyDomainSlugs,
  type MarkdownBlock,
  type StudyLanguage,
} from "@/lib/study/content";
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
  await requireApprovedUser();

  const { domainSlug } = await params;
  const query = await searchParams;
  const language: StudyLanguage = query?.lang === "zh" ? "zh" : "en";
  const alternateLanguage: StudyLanguage = language === "en" ? "zh" : "en";
  const content = getStudyContent(domainSlug, language);

  if (!content) {
    notFound();
  }

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
        </aside>
      </section>
    </main>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const Tag = block.depth === 1 ? "h1" : block.depth === 2 ? "h2" : "h3";
    const className =
      block.depth === 2
        ? "pt-3 text-2xl font-semibold tracking-normal"
        : "pt-2 text-xl font-semibold tracking-normal";

    return <Tag className={className}>{block.text}</Tag>;
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

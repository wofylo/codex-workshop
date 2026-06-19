import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { getStudyDomains, type StudyDomain } from "./dashboard.ts";

export type StudyLanguage = "en" | "zh";

export type StudySection = {
  id: string;
  depth: 2 | 3;
  title: string;
};

export type MarkdownBlock =
  | { type: "heading"; depth: 1 | 2 | 3; text: string; anchor?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "rule" };

export type StudyContent = {
  domain: StudyDomain;
  language: StudyLanguage;
  sourcePath: string;
  title: string;
  blocks: MarkdownBlock[];
  sections: StudySection[];
};

const workspaceRoot = process.cwd();

export function getStudyDomainSlugs(): string[] {
  return getStudyDomains().map((domain) => domain.slug);
}

export function getStudyDomainBySlug(slug: string): StudyDomain | null {
  return getStudyDomains().find((domain) => domain.slug === slug) ?? null;
}

export function getStudyContent(slug: string, language: StudyLanguage): StudyContent | null {
  const domain = getStudyDomainBySlug(slug);

  if (!domain) {
    return null;
  }

  const sourcePath = language === "zh" ? domain.chineseGuide : domain.englishGuide;
  const absolutePath = resolveAllowedGuidePath(sourcePath);
  const markdown = readFileSync(absolutePath, "utf8");
  const blocks = renderMarkdownBlocks(markdown);
  const sections = getStudySections(blocks);
  const title =
    blocks.find((block): block is Extract<MarkdownBlock, { type: "heading" }> => {
      return block.type === "heading" && block.depth === 1;
    })?.text ?? domain.title;

  return {
    domain,
    language,
    sourcePath,
    title,
    blocks,
    sections,
  };
}

export function renderMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  const usedAnchors = new Map<string, number>();

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraph.join(" ").replace(/\s+/g, " ").trim(),
    });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      blocks.push({ type: "rule" });
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      const depth = heading[1].length as 1 | 2 | 3;
      const text = heading[2].trim();
      const block: MarkdownBlock = {
        type: "heading",
        depth,
        text,
      };

      if (depth === 2 || depth === 3) {
        block.anchor = createUniqueAnchor(text, usedAnchors);
      }

      blocks.push(block);
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, "") });
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const listItems = [unordered?.[1] ?? ordered?.[1] ?? ""];
      const orderedList = Boolean(ordered);

      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();
        const nextUnordered = /^[-*]\s+(.+)$/.exec(nextLine);
        const nextOrdered = /^\d+\.\s+(.+)$/.exec(nextLine);

        if ((orderedList && !nextOrdered) || (!orderedList && !nextUnordered)) {
          break;
        }

        listItems.push(nextUnordered?.[1] ?? nextOrdered?.[1] ?? "");
        index += 1;
      }

      blocks.push({ type: "list", ordered: orderedList, items: listItems });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function getStudySections(blocks: MarkdownBlock[]): StudySection[] {
  return blocks.flatMap((block) => {
    if (block.type !== "heading" || !block.anchor || (block.depth !== 2 && block.depth !== 3)) {
      return [];
    }

    return [
      {
        id: block.anchor,
        depth: block.depth,
        title: block.text,
      },
    ];
  });
}

function createUniqueAnchor(text: string, usedAnchors: Map<string, number>): string {
  const baseAnchor = createAnchor(text);
  const count = usedAnchors.get(baseAnchor) ?? 0;
  usedAnchors.set(baseAnchor, count + 1);

  return count === 0 ? baseAnchor : `${baseAnchor}-${count + 1}`;
}

function createAnchor(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[<>]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim()
    .replace(/[\s-]+/g, "-");

  return normalized || "section";
}

function resolveAllowedGuidePath(sourcePath: string): string {
  const normalizedSource = normalize(sourcePath).replace(/\\/g, "/");
  const allowedPaths = new Set(
    getStudyDomains().flatMap((domain) => [domain.englishGuide, domain.chineseGuide]),
  );

  if (!allowedPaths.has(normalizedSource)) {
    throw new Error(`Unsupported study guide path: ${sourcePath}`);
  }

  const [directory, fileName] = normalizedSource.split("/");
  if (directory !== "CCA-F" || !fileName) {
    throw new Error(`Study guide path must stay inside CCA-F: ${sourcePath}`);
  }

  return join(workspaceRoot, "CCA-F", fileName);
}

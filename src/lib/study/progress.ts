import type { StudyLanguage, StudySection } from "./content.ts";

export type StudyProgressRow = {
  section_id: string;
  section_title: string;
  is_read: boolean;
  read_at: string | null;
};

export type StudyProgressSummary = {
  totalSections: number;
  readSections: number;
  percentage: number;
};

export type StudySectionProgress = {
  section: StudySection;
  isRead: boolean;
  readAt: string | null;
};

export type StudyProgressState = {
  summary: StudyProgressSummary;
  bySectionId: Record<string, StudySectionProgress>;
};

export type StudyProgressMutationInput = {
  userId: string;
  domainSlug: string;
  language: StudyLanguage;
  section: StudySection;
  read: boolean;
  now: string;
};

export type StudyProgressMutation = {
  user_id: string;
  domain_slug: string;
  language: StudyLanguage;
  section_id: string;
  section_title: string;
  is_read: boolean;
  read_at: string | null;
  last_viewed_at: string;
};

export function buildStudyProgressState(
  sections: StudySection[],
  rows: StudyProgressRow[],
): StudyProgressState {
  const currentSectionIds = new Set(sections.map((section) => section.id));
  const rowsBySectionId = new Map(
    rows
      .filter((row) => currentSectionIds.has(row.section_id))
      .map((row) => [row.section_id, row]),
  );
  const bySectionId: Record<string, StudySectionProgress> = {};
  let readSections = 0;

  for (const section of sections) {
    const row = rowsBySectionId.get(section.id);
    const isRead = row?.is_read === true;

    if (isRead) {
      readSections += 1;
    }

    bySectionId[section.id] = {
      section,
      isRead,
      readAt: row?.read_at ?? null,
    };
  }

  const totalSections = sections.length;

  return {
    summary: {
      totalSections,
      readSections,
      percentage: totalSections === 0 ? 0 : Math.round((readSections / totalSections) * 100),
    },
    bySectionId,
  };
}

export function buildStudyProgressMutation(
  input: StudyProgressMutationInput,
): StudyProgressMutation {
  return {
    user_id: input.userId,
    domain_slug: input.domainSlug,
    language: input.language,
    section_id: input.section.id,
    section_title: input.section.title,
    is_read: input.read,
    read_at: input.read ? input.now : null,
    last_viewed_at: input.now,
  };
}

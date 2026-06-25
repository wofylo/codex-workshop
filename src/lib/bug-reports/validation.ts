export const BUG_CATEGORIES = ["bug", "feature", "other"] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number];

export const BUG_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export const MAX_FILES = 3;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateBugTitle(title: unknown): string | null {
  if (typeof title !== "string" || title.trim().length === 0) {
    return "Title is required";
  }
  if (title.trim().length > 200) {
    return "Title must be 200 characters or fewer";
  }
  return null;
}

export function validateBugDescription(description: unknown): string | null {
  if (typeof description !== "string" || description.trim().length === 0) {
    return "Description is required";
  }
  return null;
}

export function isBugCategory(value: unknown): value is BugCategory {
  return BUG_CATEGORIES.includes(value as BugCategory);
}

export function isBugStatus(value: unknown): value is BugStatus {
  return BUG_STATUSES.includes(value as BugStatus);
}

export function validateBugFiles(files: File[]): string | null {
  if (files.length > MAX_FILES) {
    return `Maximum ${MAX_FILES} files allowed`;
  }
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 5 MB limit`;
    }
  }
  return null;
}

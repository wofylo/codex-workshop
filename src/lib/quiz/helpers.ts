export type QuizQuestionSnapshot = {
  question_en: string;
  choices_en: string[];
  explanation_en: string;
};

export type QuizAnswerInput = {
  selectedChoiceIndex: number | null;
  correctChoiceIndex: number;
};

export type ScoreResult = {
  score: number;
  total: number;
  percentage: number;
};

export function scoreAnswer(selectedIndex: number | null, correctIndex: number): boolean {
  if (selectedIndex === null) return false;
  return selectedIndex === correctIndex;
}

export function scoreAttempt(answers: QuizAnswerInput[]): ScoreResult {
  if (answers.length === 0) return { score: 0, total: 0, percentage: 0 };
  const score = answers.filter((a) => scoreAnswer(a.selectedChoiceIndex, a.correctChoiceIndex)).length;
  return {
    score,
    total: answers.length,
    percentage: Math.round((score / answers.length) * 100),
  };
}

export function parseChoiceIndex(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

export function choiceLabel(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, D
}

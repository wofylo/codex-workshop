"use client";

import { useTransition } from "react";
import { saveAnswerAction, submitAttemptAction } from "@/app/practice/actions";

type AttemptFormProps = {
  attemptId: string;
  questionChoiceOrders: Record<string, number[]>;
  questionIds: Record<string, string>;
  children: React.ReactNode;
};

export function AttemptForm({
  attemptId,
  questionChoiceOrders,
  questionIds,
  children,
}: AttemptFormProps) {
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLFormElement>) {
    const target = e.target as unknown as HTMLInputElement;
    if (target.type !== "radio") return;

    // Radio name is `q_${attemptQuestionId}`, value is displayIdx (0-3)
    const aqId = target.name.slice(2);
    const displayIdx = parseInt(target.value, 10);
    if (isNaN(displayIdx)) return;

    const choiceOrder = questionChoiceOrders[aqId] ?? [0, 1, 2, 3];
    const questionId = questionIds[aqId];
    if (!questionId) return;

    const fd = new FormData();
    fd.append("attempt_id", attemptId);
    fd.append("attempt_question_id", aqId);
    fd.append("question_id", questionId);
    fd.append("answer", String(displayIdx));
    fd.append("choice_order", JSON.stringify(choiceOrder));

    startTransition(async () => {
      await saveAnswerAction(fd);
    });
  }

  return (
    <form action={submitAttemptAction} className="space-y-5" onChange={handleChange}>
      <input name="attempt_id" type="hidden" value={attemptId} />
      {children}
    </form>
  );
}

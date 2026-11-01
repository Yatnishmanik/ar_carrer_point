import type { TestAttemptResult } from '../types';

export interface SectionSummary {
  name: string; score: number; maxScore: number; attempted: number; total: number;
  correct: number; wrong: number; accuracy: number; timeSpentSeconds: number | null;
}

export function summarizeSections(result: TestAttemptResult): SectionSummary[] {
  const sections = new Map<string, SectionSummary>();
  result.questions.forEach((question, index) => {
    const name = question.subject?.trim() || 'General';
    const section = sections.get(name) || { name, score: 0, maxScore: 0, attempted: 0, total: 0, correct: 0, wrong: 0, accuracy: 0, timeSpentSeconds: 0 };
    const selected = result.answers[index];
    const answered = selected !== undefined;
    const correct = answered && selected === question.correctOptionIndex;
    section.total++;
    section.maxScore += question.marks ?? 1;
    section.attempted += Number(answered);
    section.correct += Number(correct);
    section.wrong += Number(answered && !correct);
    section.score += result.questionMarks?.[question.id] ?? (answered ? correct ? (question.marks ?? 1) : -(question.negativeMarks ?? .25) : 0);
    const time = result.questionTimes?.[question.id];
    section.timeSpentSeconds = time == null || section.timeSpentSeconds == null ? null : section.timeSpentSeconds + time;
    sections.set(name, section);
  });
  return Array.from(sections.values(), section => ({ ...section,
    score: Number(section.score.toFixed(2)), maxScore: Number(section.maxScore.toFixed(2)),
    accuracy: section.attempted ? Number((section.correct / section.attempted * 100).toFixed(2)) : 0,
  }));
}

// Round tracked milliseconds to whole seconds while preserving the test's total duration.
export function allocateQuestionSeconds(milliseconds: Record<number, number>, totalSeconds: number): Record<number, number> {
  const entries = Object.entries(milliseconds);
  if (!entries.length) return {};
  const total = entries.reduce((sum, [, value]) => sum + Math.max(0, value), 0);
  const rows = entries.map(([index, value]) => {
    const exact = total ? Math.max(0, value) / total * totalSeconds : 0;
    return { index, seconds: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  const remaining = totalSeconds - rows.reduce((sum, row) => sum + row.seconds, 0);
  rows.sort((a, b) => b.remainder - a.remainder || Number(a.index) - Number(b.index));
  if (!total) rows[0].seconds = totalSeconds;
  else for (let i = 0; i < remaining; i++) rows[i % rows.length].seconds++;
  return Object.fromEntries(rows.map(row => [row.index, row.seconds]));
}

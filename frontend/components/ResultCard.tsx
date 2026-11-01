'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { summarizeSections, type SectionSummary } from '../lib/performance';
import { apiService, type LeaderboardEntry, type AttemptPerformance } from '../lib/api';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  Target,
  Award,
  ClipboardCheck,
  Users,
} from 'lucide-react';

export const ResultCard: React.FC = () => {
  const { currentResult, retakeCurrentTest, setActiveTab, language, t } = useApp();
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [leaderboardState, setLeaderboardState] = useState<{ testId: string; rows: LeaderboardEntry[]; error: boolean } | null>(null);
  const testId = currentResult?.testId;
  const attemptId = currentResult?.id;
  const [rankingState, setRankingState] = useState<{ attemptId: string; data: AttemptPerformance | null; error: boolean } | null>(null);
  const [rankingRetry, setRankingRetry] = useState(0);
  const ranking = rankingState && rankingState.attemptId === attemptId ? rankingState.data : null;
  const rankingError = rankingState && rankingState.attemptId === attemptId && rankingState.error;
  const rankingLoading = Boolean(attemptId && rankingState?.attemptId !== attemptId);
  useEffect(() => {
    if (!attemptId) return;
    let active = true;
    apiService.getAttemptPerformance(attemptId)
      .then(data => { if (active) setRankingState({ attemptId, data, error: false }); })
      .catch(() => { if (active) setRankingState({ attemptId, data: null, error: true }); });
    return () => { active = false; };
  }, [attemptId, rankingRetry]);
  const leaderboard = leaderboardState && leaderboardState.testId === testId ? leaderboardState.rows : [];
  const leaderboardLoading = Boolean(testId && leaderboardState?.testId !== testId);
  const leaderboardError = Boolean(testId && leaderboardState?.testId === testId && leaderboardState.error);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    apiService.getTestLeaderboard(testId)
      .then(rows => { if (!cancelled) setLeaderboardState({ testId, rows, error: false }); })
      .catch(() => { if (!cancelled) setLeaderboardState({ testId, rows: [], error: true }); });
    return () => { cancelled = true; };
  }, [testId]);

  if (!currentResult) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">{t('No result is available yet')}</h2>
        <p className="text-xs text-slate-500 mt-2">{t('Complete a mock test first.')}</p>
        <button
          onClick={() => setActiveTab('tests')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          {t('Choose an online test')}
        </button>
      </div>
    );
  }

  const { testTitle, totalQuestions, correct, wrong, unanswered, score, maxScore, timeSpentSeconds, answers, questions } = currentResult;
  const attempted = correct + wrong;
  const accuracy = attempted ? Number((correct / attempted * 100).toFixed(2)) : 0;
  const sections = summarizeSections(currentResult);
  const number = (value: number) => new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en-IN', { maximumFractionDigits: 2 }).format(value);
  const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const overall: SectionSummary = { name: 'Overall', score, maxScore, attempted, total: totalQuestions, correct, wrong, accuracy, timeSpentSeconds };
  const barCell = (color: string, fraction: number, children: React.ReactNode) => <td className="relative isolate overflow-hidden">
    <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 border-r-[3px] ${color}`} style={{ width: `${Math.min(100, Math.max(0, fraction * 100))}%` }} />
    <div className="relative px-4 py-3.5">{children}</div>
  </td>;
  const metrics = [
    { label: 'Rank', icon: Award, color: 'bg-rose-500', value: rankingLoading ? '…' : ranking?.rank != null ? number(ranking.rank) : '—', denominator: ranking ? number(ranking.totalParticipants) : '' },
    { label: 'Score', icon: Trophy, color: 'bg-violet-500', value: number(score), denominator: number(maxScore) },
    { label: 'Attempted', icon: ClipboardCheck, color: 'bg-cyan-500', value: number(attempted), denominator: number(totalQuestions) },
    { label: 'Accuracy', icon: Target, color: 'bg-emerald-500', value: `${number(accuracy)}%`, denominator: '' },
    { label: 'Percentile', icon: Users, color: 'bg-indigo-500', value: rankingLoading ? '…' : ranking?.percentile != null ? `${number(ranking.percentile)}%` : '—', denominator: '' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">{t('Performance Analysis')}</p>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{testTitle}</h1>
      </div>

      <section aria-labelledby="performance-summary-heading">
        <h2 id="performance-summary-heading" className="mb-4 text-base font-bold text-slate-900">{t('Overall Performance Summary')}</h2>
        <div className="grid grid-cols-2 gap-y-4 rounded-md border border-slate-100 bg-white px-4 py-5 shadow-sm sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-slate-100">
          {metrics.map(metric => <div key={metric.label} className="flex min-w-0 items-center gap-3 px-2 sm:px-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${metric.color}`}><metric.icon className="h-5 w-5" strokeWidth={1.7} /></span>
            <div className="min-w-0">
              <p className="text-sm font-bold tabular-nums text-slate-900">{metric.value}{metric.denominator && <span className="ml-1 text-xs font-normal text-slate-400">/ {metric.denominator}</span>}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{t(metric.label)}</p>
            </div>
          </div>)}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">{t('Rank compares this attempt with other participants’ best attempts. Percentile is the percentage with a lower score.')}</p>
        {rankingError && <p role="status" className="mt-2 text-xs text-red-600">{t('Could not load rank and percentile.')} <button onClick={() => { setRankingState(null); setRankingRetry(value => value + 1); }} className="font-semibold underline">{t('Retry')}</button></p>}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">{t('Sectional Summary')}</h2>
            <span className="text-xs text-slate-500">{t('Passing score')}: <strong className="font-semibold text-sky-600">{number(currentResult.passingMarks && currentResult.passingMarks > 0 ? currentResult.passingMarks : maxScore * .4)} / {number(maxScore)}</strong></span>
          </div>
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[650px] border-collapse text-left text-sm">
              <thead className="text-[11px] font-normal text-slate-400"><tr>
                {['Section Name', 'Score', 'Attempted', 'Accuracy', 'Time'].map(label => <th key={label} scope="col" className="border-r border-slate-100 px-4 py-3 font-medium last:border-r-0">{t(label)}</th>)}
              </tr></thead>
              <tbody>
                {[...sections, overall].map((section, index) => <tr key={`${section.name}-${index}`} className={`border-t border-slate-200 ${index === sections.length ? 'font-semibold' : ''}`}>
                  <th scope="row" className="w-[28%] px-4 py-4 text-sm font-semibold text-slate-900">{t(section.name)}</th>
                  {barCell('border-violet-300 bg-violet-50', section.maxScore ? section.score / section.maxScore : 0, <>
                    <p className="tabular-nums text-slate-900">{number(section.score)} <span className="text-[11px] font-normal text-slate-400">/ {number(section.maxScore)}</span></p>
                    <p className="mt-1 whitespace-nowrap text-[10px] font-normal text-slate-500">{section.correct} {t('correct')} · {section.wrong} {t('wrong')}</p>
                  </>)}
                  {barCell('border-cyan-300 bg-cyan-50', section.total ? section.attempted / section.total : 0, <p className="tabular-nums text-slate-900">{number(section.attempted)} <span className="text-[11px] font-normal text-slate-400">/ {number(section.total)}</span></p>)}
                  {barCell('border-emerald-300 bg-emerald-50', section.accuracy / 100, <p className="tabular-nums text-slate-900">{number(section.accuracy)}%</p>)}
                  {barCell('border-amber-300 bg-amber-50', section.timeSpentSeconds == null ? 0 : index === sections.length && currentResult.durationMinutes ? section.timeSpentSeconds / (currentResult.durationMinutes * 60) : timeSpentSeconds ? section.timeSpentSeconds / timeSpentSeconds : 0, <>
                    <p title={section.timeSpentSeconds == null ? t('Timing was not recorded for this attempt.') : undefined} className="whitespace-nowrap tabular-nums text-slate-900">{section.timeSpentSeconds == null ? '—' : time(section.timeSpentSeconds)}{index === sections.length && currentResult.durationMinutes && <span className="text-[11px] font-normal text-slate-400"> / {time(currentResult.durationMinutes * 60)}</span>}</p>
                    {section.timeSpentSeconds == null && <p className="mt-1 text-[10px] font-normal text-slate-400">{t('Not recorded')}</p>}
                  </>)}
                </tr>)}
              </tbody>
            </table>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{t('Correct Answers')}: <strong className="text-emerald-600">{correct}</strong></span><span>{t('Incorrect Answers')}: <strong className="text-red-500">{wrong}</strong></span><span>{t('Unanswered')}: <strong className="text-slate-700">{unanswered}</strong></span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t('Time taken:')} {time(timeSpentSeconds)}</span></p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={() => setShowAnswerKey(value => !value)} className="flex items-center gap-2 rounded border border-sky-200 bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700">{showAnswerKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{showAnswerKey ? t('Hide Answer Key') : t('Show Answer Key')}</button>
            <button onClick={retakeCurrentTest} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" />{t('Retake Test')}</button>
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">{t('View Dashboard')}<ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
          <aside aria-label={t('Leaderboard')} className="rounded-lg border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><Trophy className="w-4 h-4 text-amber-500" />{t('Leaderboard')}</h3>
                <p className="mt-1 text-[11px] text-slate-500">{t('Top test takers')}</p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">{leaderboard.length}</span>
            </div>
            {leaderboardLoading ? <p className="py-6 text-center text-xs text-slate-500">{t('Loading leaderboard…')}</p>
              : leaderboardError ? <p role="alert" className="py-6 text-center text-xs text-red-600">{t('Could not load leaderboard.')}</p>
              : leaderboard.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">{t('No leaderboard results yet. Be the first to complete this test.')}</p>
              : <div className="max-h-72 overflow-y-auto pr-1">
                <div className="grid grid-cols-[34px_minmax(0,1fr)_auto_auto] gap-2 border-b border-slate-200 px-1 pb-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                  <span>{t('Rank')}</span><span>{t('Student')}</span><span>{t('Score')}</span><span>{t('Time')}</span>
                </div>
                <ol className="divide-y divide-slate-100">
                  {leaderboard.map(entry => (
                    <li key={`${entry.rank}-${entry.name}`} className={`grid grid-cols-[34px_minmax(0,1fr)_auto_auto] items-center gap-2 py-2.5 px-1 ${entry.rank === 1 ? 'text-amber-800' : 'text-slate-700'}`}>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${entry.rank === 1 ? 'bg-amber-100' : entry.rank === 2 ? 'bg-slate-200' : entry.rank === 3 ? 'bg-orange-100' : 'bg-white border border-slate-200'}`}>{entry.rank}</span>
                      <span className="truncate text-xs font-bold" title={entry.name}>{entry.name}</span>
                      <span className="whitespace-nowrap text-[11px] font-extrabold">{entry.score}/{entry.maxScore}</span>
                      <span className="whitespace-nowrap text-[10px] text-slate-500">{Math.floor(entry.timeSpentSeconds / 60)}:{String(entry.timeSpentSeconds % 60).padStart(2, '0')}</span>
                    </li>
                  ))}
                </ol>
              </div>}
          </aside>
      </div>

      {/* Answer Key & Explanation Accordion */}
      {showAnswerKey && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {t('Answer Key & Detailed Explanations')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('Correct answers and explanations for every question.')}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {questions.length} {t('questions')}
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selectedIdx = answers[idx];
              const isCorrect = selectedIdx === q.correctOptionIndex;
              const isSkipped = selectedIdx === undefined;

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isSkipped
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-red-50/40 border-red-200'
                  }`}
                >
                  {/* Question Title & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      <span className="text-blue-600 mr-2">Q{idx + 1}.</span>
                      {q.questionText}
                    </div>

                    <div className="shrink-0">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {t('Correct')} (+{q.marks ?? 1})
                        </span>
                      )}
                      {!isCorrect && !isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          {t('Wrong')} (-{q.negativeMarks ?? 0.25})
                        </span>
                      )}
                      {isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-200 text-slate-700">
                          {t('Skipped')} (0.00)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User's response vs Correct answer */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200">
                      <span className="font-bold text-slate-500 block mb-0.5">{t('Your answer:')}</span>
                      <span className={`font-semibold ${
                        isCorrect ? 'text-emerald-700' : isSkipped ? 'text-slate-500' : 'text-red-600'
                      }`}>
                        {isSkipped
                          ? t('Not attempted')
                          : `${['A', 'B', 'C', 'D'][selectedIdx]}. ${q.options[selectedIdx]?.text}`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200">
                      <span className="font-bold text-emerald-700 block mb-0.5">{t('Correct answer:')}</span>
                      <span className="font-bold text-emerald-900">
                        {['A', 'B', 'C', 'D'][q.correctOptionIndex]}. {q.options[q.correctOptionIndex]?.text}
                      </span>
                    </div>
                  </div>

                  {/* Explanation Note */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                      <div className="font-extrabold text-amber-800 flex items-center gap-1 mb-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t('Explanation:')}
                      </div>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

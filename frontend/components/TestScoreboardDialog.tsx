'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock3, RefreshCw, Trophy, X } from 'lucide-react';
import { apiService, type ApiScoreboard } from '../lib/api';
import { useApp } from '../context/AppContext';

const formatDate = (date: string) => new Date(date).toLocaleString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
const formatScore = (score: number) => Number(score.toFixed(2)).toString();

export function TestScoreboardDialog({ initialData }: { initialData: ApiScoreboard }) {
  const { closeTestScoreboard, startTestById, startingTestId, reviewAttempt } = useApp();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const refreshRequest = useRef<AbortController | null>(null);
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const starting = startingTestId === data.test.id;
  const latest = data.latestAttempt;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();
    return () => { refreshRequest.current?.abort(); dialog.close(); document.body.style.overflow = overflow; };
  }, []);

  async function refresh() {
    if (refreshing) return;
    const request = new AbortController();
    refreshRequest.current = request;
    setRefreshing(true); setError('');
    try { setData(await apiService.getTestScoreboard(data.test.id, request.signal)); }
    catch (error) { if (!request.signal.aborted) setError(error instanceof Error ? error.message : 'Could not refresh the scoreboard.'); }
    finally { if (!request.signal.aborted) setRefreshing(false); }
  }
  async function viewResult(id: string) {
    if (reviewing) return;
    setReviewing(id);
    try { await reviewAttempt(id); } finally { setReviewing(null); }
  }

  return <dialog ref={dialogRef} aria-labelledby="scoreboard-title" aria-describedby="scoreboard-description"
    onCancel={event => { event.preventDefault(); closeTestScoreboard(); }}
    onClick={event => { if (event.target === event.currentTarget) closeTestScoreboard(); }}
    className="fixed inset-0 m-auto w-[calc(100%-24px)] max-w-5xl max-h-[92dvh] rounded-3xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
    <div className="max-h-[92dvh] overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white border-slate-200 px-5 py-5 sm:px-7">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-700">You have attempted this test</p>
          <h2 id="scoreboard-title" className="text-xl font-black sm:text-2xl">{data.test.title}</h2>
          <p id="scoreboard-description" className="mt-2 text-sm text-slate-500">Review your results, compare scores, or try again.</p>
        </div>
        <button ref={closeRef} type="button" aria-label="Close scoreboard" onClick={closeTestScoreboard} className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"><X className="size-5" /></button>
      </header>

      <div className="grid md:grid-cols-[1fr_1.05fr]">
        <section aria-labelledby="your-attempt-title" className="p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3"><h3 id="your-attempt-title" className="text-lg font-bold">Your latest attempt</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{data.attemptCount} {data.attemptCount === 1 ? 'attempt' : 'attempts'}</span></div>
          {latest ? <>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-center justify-between gap-3"><p className="text-3xl font-black text-blue-950">{formatScore(latest.score)} <span className="text-base font-semibold text-slate-500">/ {formatScore(latest.maxScore)}</span></p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${latest.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{latest.passed ? 'Passed' : 'Not passed'}</span></div>
              <p className="mt-1 text-sm font-semibold text-blue-800">{latest.percentage}% score</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div><dt className="text-xs font-semibold uppercase text-slate-500">Attempted on</dt><dd className="mt-1 font-semibold"><time dateTime={latest.createdAt}>{formatDate(latest.createdAt)}</time></dd></div>
                <div className="flex justify-between gap-2"><dt className="flex items-center gap-1.5 text-slate-600"><Clock3 className="size-4" />Time taken</dt><dd className="font-bold">{formatTime(latest.timeSpentSeconds)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-600">Correct / Wrong / Skipped</dt><dd className="font-bold">{latest.correctCount} / {latest.incorrectCount} / {latest.unansweredCount}</dd></div>
              </dl>
              {data.yourBest && <p className="mt-4 border-t border-blue-200 pt-3 text-sm font-bold text-blue-900">Your best rank: #{data.yourBest.rank} of {data.participantCount} students</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={starting || reviewing !== null} onClick={() => void startTestById(data.test.id, true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">{starting ? 'Starting retry…' : 'Retry test'}<ArrowRight className="size-4" /></button>
              <button type="button" disabled={reviewing !== null || starting} onClick={() => void viewResult(latest.id)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold hover:bg-slate-50 disabled:opacity-50">{reviewing === latest.id ? 'Loading…' : 'View result'}</button>
            </div>
          </> : <p className="text-sm text-slate-500">No saved attempt is available.</p>}
          {data.attempts.length > 1 && <div>
            <h4 className="font-bold text-sm mb-3">Previous attempts</h4>
            <ol className="space-y-2">{data.attempts.slice(1).map(attempt => <li key={attempt.id} className="rounded-xl border border-slate-200 p-3 text-xs">
              <div className="flex justify-between gap-2"><time dateTime={attempt.createdAt} className="font-semibold">{formatDate(attempt.createdAt)}</time><span className={attempt.passed ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{attempt.passed ? 'Passed' : 'Not passed'}</span></div>
              <div className="mt-2 flex items-center justify-between gap-2"><span>{formatScore(attempt.score)} / {formatScore(attempt.maxScore)} · {formatTime(attempt.timeSpentSeconds)}</span>
                <button type="button" disabled={reviewing !== null || starting} onClick={() => void viewResult(attempt.id)} className="font-bold text-blue-700 underline disabled:opacity-50">View attempt</button></div>
            </li>)}</ol>
            {data.attemptCount > data.attempts.length && <p className="mt-2 text-xs text-slate-500">Showing your 10 most recent attempts. Older results remain available in your dashboard.</p>}
          </div>}
        </section>

        <section aria-labelledby="leaderboard-title" className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7 md:border-l md:border-t-0">
          <div className="flex items-center justify-between gap-3"><h3 id="leaderboard-title" className="flex items-center gap-2 text-lg font-bold"><Trophy className="size-5 text-amber-600" />Leaderboard</h3>
            <button type="button" aria-label="Refresh leaderboard" disabled={refreshing || starting} onClick={() => void refresh()} className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">Best score per student. Ties: faster time, then earlier attempt. {data.participantCount} {data.participantCount === 1 ? 'student' : 'students'} · Top 20</p>
          {error && <p role="alert" className="my-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {refreshing && <p role="status" className="mt-3 text-xs text-blue-700">Refreshing scores…</p>}
          {!data.leaderboard.length ? <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No student scores yet. Admin attempts are not ranked.</p> : <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs"><caption className="sr-only">Student rankings for {data.test.title}</caption>
              <thead className="border-b bg-slate-100 text-slate-500"><tr><th scope="col" className="px-3 py-3">Rank</th><th scope="col" className="px-3 py-3">Student</th><th scope="col" className="px-3 py-3 text-right">Score</th><th scope="col" className="px-3 py-3 text-right">Time</th></tr></thead>
              <tbody>{data.leaderboard.map(entry => <tr key={entry.rank} className={`border-b border-slate-100 last:border-0 ${entry.isYou ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-4 font-black text-slate-700">#{entry.rank}</td>
                <td className="max-w-40 px-3 py-4"><span className="block break-words font-bold">{entry.name}{entry.isYou && <span className="ml-1 rounded bg-blue-100 px-1 text-blue-800">You</span>}</span><time dateTime={entry.createdAt} className="mt-1 block text-[10px] text-slate-500">{formatDate(entry.createdAt)}</time></td>
                <td className="whitespace-nowrap px-3 py-4 text-right font-bold">{formatScore(entry.score)} / {formatScore(entry.maxScore)}</td>
                <td className="whitespace-nowrap px-3 py-4 text-right text-slate-600">{formatTime(entry.timeSpentSeconds)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
          {data.yourBest && data.yourBest.rank > 20 && <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-900">You · #{data.yourBest.rank} · {formatScore(data.yourBest.score)} / {formatScore(data.yourBest.maxScore)} · {formatTime(data.yourBest.timeSpentSeconds)}</p>}
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Retry as often as you like. Your best result stays on the leaderboard; your latest result is shown on the left.</p>
        </section>
      </div>
    </div>
  </dialog>;
}

'use client';
import { useState } from 'react';
import { apiService } from '../lib/api';
import { useApp } from '../context/AppContext';

const inputClass = 'w-full mt-1 rounded-xl border border-slate-300 p-2.5 text-sm bg-white';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'The request failed. Please retry.';

export function AdminTestsManager({ selectedTestId, onSelectTest }: { selectedTestId: string; onSelectTest: (id: string) => void }) {
  const { exams, adminTests, refreshAdminData, refreshData, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [duration, setDuration] = useState(30);
  const [passingMarks, setPassingMarks] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function createTest(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const test = await apiService.createTest({ title, subtitle, categoryId: categoryId || undefined,
        categoryName: categoryId ? undefined : categoryName, durationMinutes: duration, passingMarks,
        instructions: instructions.split('\n').map(line => line.trim()).filter(Boolean) });
      onSelectTest(test.id); setTitle(''); setSubtitle(''); setInstructions('');
      await refreshAdminData();
      showToast('Draft created. Add questions below, then publish the test.', 'success');
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); }
  }

  async function changePublication(id: string, isPublished: boolean) {
    if (pendingId) return;
    setPendingId(id); setError('');
    try {
      await apiService.setTestPublished(id, isPublished);
      await Promise.all([refreshAdminData(), refreshData()]);
      showToast(isPublished ? 'Test published. Students can now take it.' : 'Test unpublished.', 'success');
    } catch (error) { setError(errorMessage(error)); }
    finally { setPendingId(null); }
  }

  return <section aria-labelledby="test-management-title" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5">
    <div><h2 id="test-management-title" className="text-xl font-bold text-slate-900">Create and publish tests</h2>
      <p className="text-sm text-slate-600 mt-1">1. Create a draft. 2. Select it and add questions below. 3. Publish when ready.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form aria-label="Create test" onSubmit={createTest} className="grid sm:grid-cols-2 gap-4">
      <label className="text-sm font-semibold" htmlFor="test-title">Test title<input id="test-title" required maxLength={200} className={inputClass} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="text-sm font-semibold" htmlFor="test-subtitle">Subtitle (optional)<input id="test-subtitle" maxLength={500} className={inputClass} value={subtitle} onChange={e => setSubtitle(e.target.value)} /></label>
      <label className="text-sm font-semibold" htmlFor="test-exam">Exam category<select id="test-exam" className={inputClass} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
        <option value="">Custom category</option>{exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
      </select></label>
      {!categoryId && <label className="text-sm font-semibold" htmlFor="test-category">Category name<input id="test-category" required className={inputClass} value={categoryName} onChange={e => setCategoryName(e.target.value)} /></label>}
      <label className="text-sm font-semibold" htmlFor="test-duration">Duration (minutes)<input id="test-duration" type="number" min={1} max={480} required className={inputClass} value={duration} onChange={e => setDuration(Number(e.target.value))} /></label>
      <label className="text-sm font-semibold" htmlFor="test-passing">Passing marks (0 = 40%)<input id="test-passing" type="number" min={0} step="0.25" required className={inputClass} value={passingMarks} onChange={e => setPassingMarks(Number(e.target.value))} /></label>
      <label className="text-sm font-semibold sm:col-span-2" htmlFor="test-instructions">Instructions (one per line)<textarea id="test-instructions" rows={2} className={inputClass} value={instructions} onChange={e => setInstructions(e.target.value)} /></label>
      <div className="sm:col-span-2"><button disabled={saving} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create draft test'}</button></div>
    </form>
    <div className="border-t pt-5 space-y-3">
      <h3 className="font-bold">Your tests ({adminTests.length})</h3>
      {!adminTests.length && <p className="text-sm text-slate-500">No tests yet. Create your first draft above.</p>}
      {adminTests.map(test => <article key={test.id} className={`rounded-xl border p-4 ${selectedTestId === test.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <div><h4 className="font-bold">{test.title}</h4><p className="text-sm text-slate-600">{test.category} · {test.durationMinutes} minutes · {test.questionCount || 0} questions · {test.totalMarks} marks</p>
            <p className="text-xs font-semibold mt-1">{test.isPublished ? 'Published' : 'Draft'}{Boolean(test.attemptCount) && ' · Questions locked because students have submitted attempts'}</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onSelectTest(test.id)} className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-800">{selectedTestId === test.id ? 'Selected' : 'Select questions'}</button>
            <button type="button" disabled={pendingId !== null || (!test.isPublished && !test.questionCount)} onClick={() => void changePublication(test.id, !test.isPublished)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{pendingId === test.id ? 'Saving…' : test.isPublished ? 'Unpublish' : 'Publish'}</button>
          </div>
        </div>
      </article>)}
    </div>
  </section>;
}

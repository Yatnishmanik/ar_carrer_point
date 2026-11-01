'use client';

import { useRef, useState } from 'react';
import { Upload, Download, FileCheck2, AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MAX_IMPORT_FILE_BYTES, MAX_IMPORT_QUESTIONS, parseQuestionImport, type QuestionImportPreview } from '../lib/question-import';
import type { BulkImportResult } from '../lib/api';

export function BulkQuestionUpload() {
  const { tests, importQuestionsToTest, t } = useApp();
  const [testId, setTestId] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<QuestionImportPreview | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [receipt, setReceipt] = useState<(BulkImportResult & { testTitle: string }) | null>(null);
  const readVersion = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedTest = tests.find(test => test.id === testId);
  const busy = reading || importing;

  const readFile = async (file?: File) => {
    const version = ++readVersion.current;
    setPreview(null); setError(''); setReceipt(null); setFileName(file?.name || '');
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'json') { setError(t('Upload a CSV or JSON file using the template.')); return; }
    if (file.size > MAX_IMPORT_FILE_BYTES) { setError(t('The file must be 2 MB or smaller.')); return; }
    setReading(true);
    try {
      const bytes = await file.arrayBuffer();
      if (version !== readVersion.current) return;
      let text: string;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
      catch { throw new Error(t('Save the file as CSV UTF-8 or UTF-8 JSON, then upload it again.')); }
      setPreview(parseQuestionImport(text, extension));
    } catch (cause) { if (version === readVersion.current) setError(cause instanceof Error ? cause.message : t('Could not read the file.')); }
    finally { if (version === readVersion.current) setReading(false); }
  };

  const handleImport = async () => {
    if (!selectedTest || !preview?.rows.length || preview.errors.length || busy || receipt) return;
    setImporting(true); setError('');
    try {
      const result = await importQuestionsToTest(selectedTest.id, preview.rows.map(row => row.question));
      setReceipt({ ...result, testTitle: selectedTest.title });
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not import questions.')); }
    finally { setImporting(false); }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
      <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Upload className="h-5 w-5" /></span>
      <div><h2 className="text-lg font-black text-slate-900">{t('Bulk Upload Questions')}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{t('Select a test, upload your file, review the preview, and import all questions together.')}</p></div>
    </div>

    <div className="space-y-5">
      <div>
        <label htmlFor="bulk-test" className="mb-1.5 block text-sm font-bold text-slate-700">{t('Select a test')}</label>
        <select id="bulk-test" value={testId} disabled={busy} onChange={event => { setTestId(event.target.value); setReceipt(null); setError(''); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm disabled:opacity-60">
          <option value="">{t('Select a test')}</option>
          {tests.map(test => <option key={test.id} value={test.id}>{test.title} ({test.questionCount ?? test.questions.length} {t('questions')})</option>)}
        </select>
        {!tests.length && <p className="mt-2 text-xs text-amber-700">{t('Create a test before uploading questions.')}</p>}
        {selectedTest && <p className="mt-2 text-xs text-slate-500">{t('Questions will be added to:')} <strong className="text-slate-800">{selectedTest.title}</strong></p>}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-sm font-bold text-slate-800">{t('Download a template')}</h3><p className="mt-1 text-xs text-slate-500">{t('For Excel, save the completed template as CSV UTF-8.')}</p></div>
          <div className="flex gap-2">
            <a href="/templates/questions-template.csv" download className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700"><Download className="h-3.5 w-3.5" />{t('CSV template')}</a>
            <a href="/templates/questions-template.json" download className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700"><Download className="h-3.5 w-3.5" />{t('JSON template')}</a>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">{t('Required columns:')} <code className="break-words text-[11px]">question, optionA, optionB, optionC, optionD, correctAnswer</code></p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{t('Optional columns:')} <code className="text-[11px]">subject, explanation, marks, negativeMarks</code></p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{t('Use A, B, C, or D for correctAnswer. Blank marks default to 1, and blank negativeMarks default to 0.25.')}</p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 sm:p-5">
        <label htmlFor="bulk-file" className="mb-2 block text-sm font-bold text-slate-700">{t('Upload question file')}</label>
        <input ref={inputRef} id="bulk-file" type="file" accept=".csv,.json,text/csv,application/json" disabled={busy} onChange={event => void readFile(event.target.files?.[0])} className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 disabled:opacity-50" />
        <p className="mt-2 text-xs text-slate-400">{t('Up to {count} questions per upload. Maximum file size: 2 MB.', { count: MAX_IMPORT_QUESTIONS })}</p>
        {fileName && <p className="mt-2 break-all text-xs font-semibold text-slate-600">{fileName}</p>}
        {reading && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-blue-600"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Reading and validating file…')}</p>}
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="break-words">{error}</p></div>}
      {preview && <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileCheck2 className="h-4 w-4 text-blue-600" />{t('Question preview')}</h3>
          <p className="text-xs text-slate-500">{t('{valid} valid of {total} rows', { valid: preview.rows.length, total: preview.totalRows })}</p>
        </div>
        {preview.errors.length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="mb-2 font-bold">{t('Resolve all errors, then upload the corrected file.')}</p>
          <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-4">{preview.errors.map((item, index) => <li key={`${item.row}-${index}`}>{t('Row {row}:', { row: item.row })} {item.message}</li>)}</ul>
        </div>}
        {preview.rows.length > 0 && <div className="max-h-[440px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr>{['Row', 'Question and options', 'Subject', 'Correct answer', 'Marks', 'Negative marks'].map(label => <th scope="col" key={label} className="p-3 font-bold">{t(label)}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{preview.rows.slice(0, 50).map(({ row, question }) => <tr key={row} className="align-top">
              <td className="p-3 text-slate-400">{row}</td>
              <td className="min-w-[300px] p-3"><p className="whitespace-pre-wrap font-semibold leading-5 text-slate-800">{question.questionText}</p><ol className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-slate-500">{question.options.map((option, index) => <li key={index} className="whitespace-pre-wrap"><strong>{String.fromCharCode(65 + index)}.</strong> {option.text}</li>)}</ol></td>
              <td className="p-3 text-slate-500">{question.subject || t('General')}</td>
              <td className="p-3 font-bold text-emerald-700">{String.fromCharCode(65 + question.options.findIndex(option => option.isCorrect))}</td>
              <td className="p-3">{question.marks}</td><td className="p-3">{question.negativeMarks}</td>
            </tr>)}</tbody>
          </table>
        </div>}
        {preview.rows.length > 50 && <p className="text-xs text-slate-400">{t('Showing the first 50 questions. All rows have been validated.')}</p>}
      </>}

      {receipt && <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">{t('Imported {count} questions into {test}.', { count: receipt.importedCount, test: receipt.testTitle })}</p><p className="mt-1 text-xs">{t('Test total marks:')} {receipt.totalMarks}</p></div></div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button type="button" disabled={!selectedTest || !preview?.rows.length || Boolean(preview?.errors.length) || busy || Boolean(receipt)} onClick={() => void handleImport()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
          {importing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{importing ? t('Importing questions…') : t('Import {count} questions', { count: preview?.rows.length || 0 })}
        </button>
        {fileName && <button type="button" disabled={busy} onClick={() => { readVersion.current++; setPreview(null); setError(''); setFileName(''); setReceipt(null); if (inputRef.current) inputRef.current.value = ''; }} className="text-xs font-semibold text-slate-500 underline disabled:opacity-50">{t('Clear file')}</button>}
      </div>
    </div>
  </section>;
}

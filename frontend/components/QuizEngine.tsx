'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { allocateQuestionSeconds } from '../lib/performance';
import {
  Clock,
  Flag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Grid,
  X,
} from 'lucide-react';

export const QuizEngine: React.FC = () => {
  const { activeTest, currentUser, submitTestAnswers, setActiveTab, showToast, t } = useApp();

  const questions = useMemo(() => activeTest?.questions || [], [activeTest]);
  const totalQuestions = questions.length;
  const sections = useMemo(() => {
    const groups = new Map<string, number[]>();
    questions.forEach((question, index) => {
      const subject = question.subject?.trim() || 'General';
      groups.set(subject, [...(groups.get(subject) || []), index]);
    });
    return Array.from(groups, ([name, indices]) => ({ name, indices }));
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Timer in seconds
  const initialDuration = (activeTest?.durationMinutes || 10) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(initialDuration);

  const submitting = useRef(false);
  const autoSubmitted = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deadline = (activeTest?.startedAt || 0) + initialDuration * 1000;
  const questionMilliseconds = useRef<Record<number, number>>({});
  const questionClock = useRef({ index: 0, startedAt: activeTest?.startedAt || 0 });
  const captureQuestionTime = useCallback((nextIndex?: number) => {
    const now = Date.now();
    const clock = questionClock.current;
    questionMilliseconds.current[clock.index] = (questionMilliseconds.current[clock.index] || 0) + Math.max(0, now - (clock.startedAt || now));
    questionClock.current = { index: nextIndex ?? clock.index, startedAt: now };
  }, []);
  const navigateTo = useCallback((index: number) => {
    if (index < 0 || index >= totalQuestions || remainingSeconds <= 0 || submitting.current) return;
    captureQuestionTime(index);
    setCurrentIndex(index);
    setVisited(prev => new Set(prev).add(index));
  }, [totalQuestions, remainingSeconds, captureQuestionTime]);

  const handleSubmit = useCallback(async () => {
    if (!activeTest || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      captureQuestionTime();
      const elapsed = Math.min(initialDuration, Math.max(0, initialDuration - remainingSeconds));
      await submitTestAnswers(selectedAnswers, Array.from(markedForReview), elapsed, allocateQuestionSeconds(questionMilliseconds.current, elapsed));
      // Keep the guard set until this quiz unmounts.
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Submission failed. Please retry.');
      setSubmitError(message);
      showToast(message, 'error');
      submitting.current = false;
    } finally { setIsSubmitting(false); }
  }, [activeTest, submitTestAnswers, selectedAnswers, markedForReview, initialDuration, remainingSeconds, showToast, t, captureQuestionTime]);

  useEffect(() => {
    if (!activeTest) return;
    const tick = () => setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeTest, deadline]);

  useEffect(() => {
    if (activeTest && remainingSeconds === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void handleSubmit();
    }
  }, [activeTest, remainingSeconds, handleSubmit]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (showSubmitModal || mobilePaletteOpen || remainingSeconds <= 0 || isSubmitting) return;
      if (e.key === 'ArrowRight') {
        if (currentIndex < totalQuestions - 1) navigateTo(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) navigateTo(currentIndex - 1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optIndex = parseInt(e.key, 10) - 1;
        if (optIndex >= (questions[currentIndex]?.options.length || 0)) return;
        setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showSubmitModal, mobilePaletteOpen, remainingSeconds, isSubmitting, navigateTo, questions]);

  useEffect(() => {
    if (!showSubmitModal && !mobilePaletteOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const buttons = () => Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    (buttons()[0] || dialog).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setShowSubmitModal(false);
        setMobilePaletteOpen(false);
      }
      if (event.key !== 'Tab') return;
      const controls = buttons();
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showSubmitModal, mobilePaletteOpen, isSubmitting]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { showToast(t('Fullscreen is unavailable in this browser.'), 'info'); }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (remainingSeconds <= 0 || isSubmitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleClearResponse = () => {
    if (remainingSeconds <= 0 || isSubmitting) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    showToast(t('Response cleared.'), 'info');
  };

  const handleToggleReview = () => {
    if (remainingSeconds <= 0 || isSubmitting) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };
  const handleMarkAndNext = () => {
    if (remainingSeconds <= 0 || isSubmitting) return;
    setMarkedForReview(prev => new Set(prev).add(currentIndex));
    if (currentIndex < totalQuestions - 1) navigateTo(currentIndex + 1);
  };

  const currentQuestion = questions[currentIndex];

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = totalQuestions - answeredCount;

  const isLowTime = remainingSeconds <= 60;
  const currentSection = sections.find(section => section.indices.includes(currentIndex));
  const answeredReviewCount = Array.from(markedForReview).filter(index => selectedAnswers[index] !== undefined).length;
  const notVisitedCount = totalQuestions - visited.size;
  const visitedUnansweredCount = Array.from(visited).filter(index => selectedAnswers[index] === undefined && !markedForReview.has(index)).length;
  const inputDisabled = remainingSeconds <= 0 || isSubmitting;
  const statusFor = (index: number) => markedForReview.has(index)
    ? (selectedAnswers[index] !== undefined ? 'answered-review' : 'review')
    : selectedAnswers[index] !== undefined ? 'answered' : visited.has(index) ? 'unanswered' : 'unvisited';
  const legend = [
    { status: 'answered', label: 'Answered', count: answeredCount - answeredReviewCount },
    { status: 'unanswered', label: 'Not Answered', count: visitedUnansweredCount },
    { status: 'unvisited', label: 'Not Visited', count: notVisitedCount },
    { status: 'review', label: 'Marked for Review', count: markedCount - answeredReviewCount },
    { status: 'answered-review', label: 'Answered & Marked for Review', count: answeredReviewCount },
  ];
  const palette = <>
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-b border-slate-200 bg-white p-4">
      {legend.map(item => <div key={item.status} className={`flex items-center gap-2 text-[11px] leading-4 ${item.status === 'answered-review' ? 'col-span-2' : ''}`}>
        <span aria-hidden="true" className={`exam-badge exam-badge--${item.status} !h-7 !w-7 shrink-0 !text-[11px]`}>{item.count}{item.status === 'answered-review' && <span className="exam-badge-check">✓</span>}</span>
        <span><span className="sr-only">{item.count} </span>{t(item.label)}</span>
      </div>)}
      <p className="col-span-2 text-[10px] leading-4 text-slate-500">{t('Answered and marked questions will also be evaluated.')}</p>
    </div>
    <h2 className="bg-gradient-to-b from-sky-500 to-sky-600 px-4 py-2 text-xs font-bold text-white">{t(currentSection?.name || 'General')}</h2>
    <div className="p-4">
      <p className="mb-4 text-xs font-semibold text-slate-600">{t('Choose a question')}</p>
      <div className="grid grid-cols-5 gap-x-3 gap-y-4">
        {(currentSection?.indices || []).map(index => <button type="button" key={questions[index].id} disabled={inputDisabled}
          onClick={() => { navigateTo(index); setMobilePaletteOpen(false); }}
          aria-current={currentIndex === index ? 'step' : undefined}
          aria-label={`${t('Question')} ${index + 1}: ${t(legend.find(item => item.status === statusFor(index))?.label || 'Not Visited')}`}
          className={`exam-palette-button ${currentIndex === index ? 'exam-palette-button--current' : ''}`}>
          <span className={`exam-badge exam-badge--${statusFor(index)}`}>{index + 1}{statusFor(index) === 'answered-review' && <span className="exam-badge-check">✓</span>}</span>
        </button>)}
      </div>
    </div>
  </>;

  if (!activeTest || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">{t('No active test found')}</h2>
        <p className="text-sm text-slate-500 mt-2">{t('Please choose a test from the test list.')}</p>
        <button
          onClick={() => setActiveTab('tests')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          {t('View available tests')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      <header className="grid shrink-0 grid-cols-1 border-b border-slate-300 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-800">{activeTest.title}</h1>
            <p className="truncate text-[11px] text-slate-500">{activeTest.category}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => void toggleFullscreen()} className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={t('Toggle Fullscreen Test Mode')}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => setMobilePaletteOpen(true)} className="flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-2 py-2 text-xs font-semibold text-sky-700 lg:hidden"><Grid className="h-4 w-4" />{currentIndex + 1}/{totalQuestions}</button>
          </div>
        </div>
        <div className="hidden items-center gap-3 border-l border-slate-300 px-4 py-2 lg:flex">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-slate-100 text-lg font-bold text-slate-700">{currentUser?.name.charAt(0).toUpperCase() || 'S'}</span>
          <div className="min-w-0"><p className="truncate text-xs font-bold">{currentUser?.name || t('Student')}</p><p className="text-[10px] text-slate-500">{t('Candidate')}</p></div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs sm:px-5">
            <p className="font-bold">{t('Sections')}</p>
            <div className={`flex items-center gap-2 font-bold tabular-nums ${isLowTime ? 'text-red-600' : 'text-slate-800'}`}><Clock className="h-3.5 w-3.5" /><span>{t('Time Left')}: {formatTimer(remainingSeconds)}</span></div>
          </div>
          <nav aria-label={t('Test sections')} className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 px-3 py-2 sm:px-5">
            {sections.map(section => <button type="button" disabled={inputDisabled} key={section.name} onClick={() => navigateTo(section.indices[0])} aria-current={currentSection?.name === section.name ? 'page' : undefined}
              className={`shrink-0 rounded-sm border px-3 py-1.5 text-xs font-semibold ${currentSection?.name === section.name ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}>
              {t(section.name)} <span className="ml-1 opacity-75">({section.indices.length})</span>
            </button>)}
          </nav>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-[11px] sm:px-5">
            <p className="font-semibold">{t('Question Type')}: {t('MCQ')}</p>
            <p>{t('Marks')}: <span className="font-semibold text-emerald-700">+{currentQuestion?.marks ?? 1}</span><span className="mx-2 text-slate-300">|</span>{t('Negative Marks')}: <span className="font-semibold text-red-600">{currentQuestion?.negativeMarks ?? 0.25}</span></p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-5">
            <h2 id="exam-question-heading" className="text-xs font-bold">{t('Question No.')} {currentIndex + 1}</h2>
            {markedForReview.has(currentIndex) && <button type="button" disabled={inputDisabled} onClick={handleToggleReview} className="flex items-center gap-1 text-[11px] font-semibold text-purple-700"><Flag className="h-3 w-3" />{t('Remove review')}</button>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {submitError && <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{submitError} <button disabled={isSubmitting} className="ml-2 font-bold underline" onClick={() => void handleSubmit()}>{t('Retry submission')}</button></div>}
            <p id="exam-question-text" className="mb-5 whitespace-pre-wrap text-sm leading-7 text-slate-900 sm:text-[15px]">{currentQuestion?.questionText}</p>
            <fieldset disabled={inputDisabled} aria-labelledby="exam-question-heading exam-question-text" className="space-y-2">
              <legend className="sr-only">{t('Choose one answer')}</legend>
              {currentQuestion?.options.map((option, index) => <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-sm border border-transparent px-2 py-3 text-sm leading-6 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-500 ${selectedAnswers[currentIndex] === index ? 'bg-sky-50/60' : 'hover:bg-slate-50'}`}>
                <input type="radio" name={`question-${currentQuestion.id}`} value={option.id} checked={selectedAnswers[currentIndex] === index} onChange={() => handleSelectOption(index)} className="mt-1.5 h-3.5 w-3.5 shrink-0 accent-sky-600" />
                <span className="whitespace-pre-wrap"><span className="mr-2 text-slate-500">{String.fromCharCode(65 + index)}.</span>{option.text}</span>
              </label>)}
            </fieldset>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-300 bg-slate-100 p-3 sm:px-5">
            <button type="button" disabled={inputDisabled} onClick={handleMarkAndNext} className="exam-secondary-button">{t('Mark for Review & Next')}</button>
            <button type="button" disabled={inputDisabled || selectedAnswers[currentIndex] === undefined} onClick={handleClearResponse} className="exam-secondary-button"><RotateCcw className="h-3.5 w-3.5" />{t('Clear Response')}</button>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" disabled={inputDisabled || currentIndex === 0} onClick={() => navigateTo(currentIndex - 1)} aria-label={t('Previous')} className="exam-secondary-button !px-2"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" disabled={inputDisabled} onClick={() => currentIndex < totalQuestions - 1 ? navigateTo(currentIndex + 1) : setShowSubmitModal(true)} className="exam-primary-button">{currentIndex < totalQuestions - 1 ? t('Save & Next') : t('Review & Submit')}<ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
            <button type="button" disabled={isSubmitting} onClick={() => setShowSubmitModal(true)} className="exam-primary-button w-full lg:hidden">{t('Submit Test')}</button>
          </footer>
        </div>

        <aside aria-label={t('Question Palette')} className="hidden min-h-0 flex-col border-l border-slate-300 bg-sky-50 lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto">{palette}</div>
          <div className="shrink-0 border-t border-slate-300 bg-sky-100/60 p-3"><button type="button" disabled={isSubmitting} onClick={() => setShowSubmitModal(true)} className="exam-primary-button w-full">{isSubmitting ? t('Submitting…') : t('Submit Test')}</button></div>
        </aside>
      </div>

      {mobilePaletteOpen && <div className="fixed inset-0 z-40 lg:hidden">
        <button type="button" aria-label={t('Close question palette')} className="absolute inset-0 bg-slate-900/50" onClick={() => setMobilePaletteOpen(false)} />
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('Question Palette')} className="absolute inset-y-0 right-0 flex w-[320px] max-w-[90vw] flex-col bg-sky-50 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4"><h2 className="text-sm font-bold">{t('Question Palette')}</h2><button autoFocus type="button" aria-label={t('Close question palette')} onClick={() => setMobilePaletteOpen(false)} className="rounded p-1 text-slate-500"><X className="h-5 w-5" /></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto">{palette}</div>
          <div className="border-t border-slate-200 p-4"><button type="button" disabled={isSubmitting} onClick={() => { setMobilePaletteOpen(false); setShowSubmitModal(true); }} className="exam-primary-button w-full">{t('Submit Test')}</button></div>
        </div>
      </div>}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="exam-submit-title" className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h3 id="exam-submit-title" className="text-lg sm:text-xl font-black text-slate-800">
              {t('Submit this test?')}
            </h3>

            <p className="text-xs text-slate-500">
              {t('You cannot change answers after submitting. Your result and explanations will appear immediately.')}
            </p>

            {/* Test Summary Stats in Modal */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <div className="text-base sm:text-lg font-black text-emerald-600">{answeredCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">{t('Answered')}</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-red-500">{unansweredCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">{t('Unanswered')}</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-purple-600">{markedCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">{t('Marked for review')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 sm:py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t('Cancel (Back)')}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => void handleSubmit()}
                className="flex-1 py-2.5 sm:py-3 text-xs font-black text-white bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:brightness-105 rounded-xl shadow-md transition-all"
              >
                {isSubmitting ? t('Submitting…') : t('Yes, submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../context/AppContext';
import { TestAttemptResult } from '../types';
import {
  Clock,
  Flag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Grid,
  X,
} from 'lucide-react';

export const QuizEngine: React.FC = () => {
  const { activeTest, finishTestAttempt, setActiveTab, showToast } = useApp();

  const questions = activeTest?.questions || [];
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Timer in seconds
  const initialDuration = (activeTest?.durationMinutes || 10) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(initialDuration);

  // Initialize/Reset test state whenever activeTest changes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setMarkedForReview(new Set());
    setVisited(new Set([0]));
    setRemainingSeconds((activeTest?.durationMinutes || 10) * 60);
    setShowSubmitModal(false);
  }, [activeTest]);

  // Mark current as visited whenever currentIndex changes
  useEffect(() => {
    setVisited((prev) => new Set(prev).add(currentIndex));
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    if (!activeTest) return;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      if (selected === undefined) {
        unansweredCount++;
      } else if (selected === q.correctOptionIndex) {
        correctCount++;
        totalScore += q.marks ?? 1;
      } else {
        wrongCount++;
        totalScore -= q.negativeMarks ?? 0.25;
      }
    });

    const maxScore = questions.reduce((acc, q) => acc + (q.marks ?? 1), 0);
    const finalScore = Math.max(0, Number(totalScore.toFixed(2)));
    const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const timeSpent = initialDuration - remainingSeconds;

    const attemptResult: TestAttemptResult = {
      id: `att-${Date.now()}`,
      testId: activeTest.id,
      testTitle: activeTest.title,
      timestamp: new Date().toISOString(),
      totalQuestions,
      attempted: Object.keys(selectedAnswers).length,
      correct: correctCount,
      wrong: wrongCount,
      unanswered: unansweredCount,
      score: finalScore,
      maxScore,
      percentage,
      timeSpentSeconds: timeSpent,
      answers: selectedAnswers,
      markedQuestions: Array.from(markedForReview),
      questions,
    };

    finishTestAttempt(attemptResult);
  }, [activeTest, questions, selectedAnswers, markedForReview, initialDuration, remainingSeconds, totalQuestions, finishTestAttempt]);

  // Countdown Timer
  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, handleSubmit]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal) return;
      if (e.key === 'ArrowRight') {
        if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optIndex = parseInt(e.key, 10) - 1;
        setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, showSubmitModal]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
    showToast('उत्तर साफ कर दिया गया।', 'info');
  };

  const handleToggleReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
        showToast('समीक्षा चिन्ह हटा दिया गया।', 'info');
      } else {
        next.add(currentIndex);
        showToast('प्रश्न को समीक्षा (Review) के लिए चिन्हित किया गया।', 'info');
      }
      return next;
    });
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

  if (!activeTest || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">कोई सक्रिय टेस्ट नहीं मिला</h2>
        <p className="text-sm text-slate-500 mt-2">कृपया टेस्ट सूची में से कोई टेस्ट चुनें।</p>
        <button
          onClick={() => setActiveTab('tests')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          उपलब्ध टेस्ट देखें
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-4 pb-24 lg:pb-6">
      {/* Test Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-[#082f6b]">
              {activeTest.category}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">
              +{currentQuestion?.marks ?? 1} | -{currentQuestion?.negativeMarks ?? 0.25}
            </span>
          </div>
          <h2 className="text-sm sm:text-xl font-black text-slate-800 mt-0.5 truncate">
            {activeTest.title}
          </h2>
        </div>

        {/* Right side Timer & Fullscreen & Submit */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
            title="Toggle Fullscreen Test Mode"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>

          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-base border transition-all ${
              isLowTime
                ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                : 'bg-blue-50 text-[#082f6b] border-blue-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLowTime ? 'text-red-500' : 'text-blue-600'}`} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
          >
            सबमिट
          </button>
        </div>
      </div>

      {/* Mobile Palette Strip (Quick view for mobile) */}
      <div className="lg:hidden flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700">
          Q{currentIndex + 1} of {totalQuestions}
          <span className="text-slate-400 font-normal ml-1">
            ({answeredCount} हल किए)
          </span>
        </span>

        <div className="flex items-center gap-2">
          {selectedAnswers[currentIndex] !== undefined && (
            <button
              onClick={handleClearResponse}
              className="text-red-600 font-semibold px-2 py-0.5 hover:bg-red-50 rounded"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setMobilePaletteOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>प्रश्न सूची ▾</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Question Palette (Sidebar) + Question Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Question Palette & Overview (Desktop Only Sidebar) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
              Question Palette (प्रश्न तालिका)
            </h3>

            {/* Status Pills */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-semibold">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>उत्तर दिया: {answeredCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 text-red-800 border border-red-200/70">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>शेष: {unansweredCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/70">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span>रिव्यू: {markedCount}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span>कुल: {totalQuestions}</span>
              </div>
            </div>

            {/* Question Number Badges Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isMarked = markedForReview.has(idx);
                const isSeen = visited.has(idx);

                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

                if (isCurrent) {
                  badgeClass = 'bg-[#0966df] text-white border-[#0966df] shadow-md ring-2 ring-blue-300 font-black';
                } else if (isMarked) {
                  badgeClass = 'bg-purple-100 text-purple-700 border-purple-300 font-bold';
                } else if (isAnswered) {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                } else if (isSeen) {
                  badgeClass = 'bg-red-50 text-red-600 border-red-200 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl text-xs flex items-center justify-center border transition-all ${badgeClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Legend Help */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>किसी भी प्रश्न पर सीधे जाने के लिए नंबर पर क्लिक करें।</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Question & Options Workspace */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm flex flex-col justify-between min-h-[420px] sm:min-h-[460px]">
            
            {/* Question Header & Subject */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-slate-100">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>

                <div className="flex items-center gap-2">
                  {currentQuestion?.subject && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600">
                      विषय: {currentQuestion.subject}
                    </span>
                  )}
                  {markedForReview.has(currentIndex) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-purple-100 text-purple-700">
                      <Flag className="w-3 h-3 fill-current" />
                      Marked
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-4 sm:mb-6">
                <span className="text-blue-600 mr-2 font-black">Q{currentIndex + 1}.</span>
                {currentQuestion?.questionText}
              </div>

              {/* Options List */}
              <div className="space-y-2.5 sm:space-y-3">
                {currentQuestion?.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const optionLetters = ['A', 'B', 'C', 'D'];

                  return (
                    <div
                      key={option.id || optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`group p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 active:scale-[0.99] ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/80'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}
                      >
                        {optionLetters[optIdx]}
                      </div>
                      <span className={`text-sm sm:text-base leading-normal ${
                        isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800 font-medium'
                      }`}>
                        {option.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Bottom Actions Bar */}
            <div className="hidden lg:flex pt-6 mt-6 border-t border-slate-100 items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleToggleReview}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                    markedForReview.has(currentIndex)
                      ? 'bg-purple-100 text-purple-700 border-purple-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedForReview.has(currentIndex) ? 'रिव्यू हटाएं' : 'Mark Review'}</span>
                </button>

                {selectedAnswers[currentIndex] !== undefined && (
                  <button
                    onClick={handleClearResponse}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
                    title="Clear selected option"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>फाइनल सबमिट करें</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Sticky Bottom Controls */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl p-2.5 pb-safe flex items-center justify-between gap-2">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none rounded-xl transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <button
          onClick={handleToggleReview}
          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1 ${
            markedForReview.has(currentIndex)
              ? 'bg-purple-100 text-purple-700 border-purple-300'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{markedForReview.has(currentIndex) ? 'Marked' : 'Review'}</span>
        </button>

        <button
          onClick={() => setMobilePaletteOpen(true)}
          className="px-2.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-1"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{currentIndex + 1}/{totalQuestions}</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-4 py-2 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit</span>
          </button>
        )}
      </div>

      {/* Mobile Question Palette Bottom Sheet */}
      {mobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobilePaletteOpen(false)}
          />

          <div className="relative bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250 pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800">Question Palette</h3>
                <p className="text-[10px] text-slate-500">किसी भी प्रश्न पर जाने के लिए टैप करें</p>
              </div>
              <button
                onClick={() => setMobilePaletteOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Count */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-bold">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <div className="text-sm font-black">{answeredCount}</div>
                <div className="text-[9px]">उत्तर दिया</div>
              </div>
              <div className="p-2 rounded-xl bg-red-50 text-red-800 border border-red-200">
                <div className="text-sm font-black">{unansweredCount}</div>
                <div className="text-[9px]">शेष</div>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                <div className="text-sm font-black">{markedCount}</div>
                <div className="text-[9px]">रिव्यू</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <div className="text-sm font-black">{totalQuestions}</div>
                <div className="text-[9px]">कुल</div>
              </div>
            </div>

            {/* Question Badges Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isMarked = markedForReview.has(idx);
                const isSeen = visited.has(idx);

                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

                if (isCurrent) {
                  badgeClass = 'bg-[#0966df] text-white border-[#0966df] shadow-md ring-2 ring-blue-300 font-black';
                } else if (isMarked) {
                  badgeClass = 'bg-purple-100 text-purple-700 border-purple-300 font-bold';
                } else if (isAnswered) {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                } else if (isSeen) {
                  badgeClass = 'bg-red-50 text-red-600 border-red-200 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setMobilePaletteOpen(false);
                    }}
                    className={`relative h-11 rounded-xl text-xs flex items-center justify-center border font-bold transition-all ${badgeClass}`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setMobilePaletteOpen(false);
                setShowSubmitModal(true);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              फाइनल सबमिट के लिए आगे बढ़ें
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              क्या आप टेस्ट सबमिट करना चाहते हैं?
            </h3>

            <p className="text-xs text-slate-500">
              सबमिट करने के बाद आप उत्तर नहीं बदल सकेंगे। आपका तत्काल परिणाम व व्याख्या स्क्रीन पर दिखाई देगी।
            </p>

            {/* Test Summary Stats in Modal */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <div className="text-base sm:text-lg font-black text-emerald-600">{answeredCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">उत्तर दिए</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-red-500">{unansweredCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">छूटे हुए</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-purple-600">{markedCount}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">रिव्यू वाले</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 sm:py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                रद्द करें (Back)
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 sm:py-3 text-xs font-black text-white bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:brightness-105 rounded-xl shadow-md transition-all"
              >
                हाँ, सबमिट करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

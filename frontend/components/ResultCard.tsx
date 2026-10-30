'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';

export const ResultCard: React.FC = () => {
  const { currentResult, retakeCurrentTest, setActiveTab, startTestById } = useApp();
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  if (!currentResult) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">अभी कोई परिणाम उपलब्ध नहीं है</h2>
        <p className="text-xs text-slate-500 mt-2">पहले कोई मॉक टेस्ट पूरा करें।</p>
        <button
          onClick={() => setActiveTab('tests')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          ऑनलाइन टेस्ट चुनें
        </button>
      </div>
    );
  }

  const {
    testTitle,
    totalQuestions,
    correct,
    wrong,
    unanswered,
    score,
    maxScore,
    percentage,
    timeSpentSeconds,
    answers,
    questions,
  } = currentResult;

  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeFormatted = `${minutes} मिनट ${seconds} सेकंड`;

  let motivationalBadge = 'अभ्यास जारी रखें!';
  let motivationalColor = 'text-amber-600 bg-amber-50 border-amber-200';
  if (percentage >= 80) {
    motivationalBadge = 'उत्कृष्ट प्रदर्शन! (Outstanding)';
    motivationalColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (percentage >= 50) {
    motivationalBadge = 'अच्छी कोशिश! (Good Effort)';
    motivationalColor = 'text-blue-700 bg-blue-50 border-blue-200';
  }

  // Calculate SVG stroke offset for gauge (circumference = 2 * PI * r = 2 * 3.14159 * 58 ≈ 364.4)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title & Test Info */}
      <div className="text-center space-y-1.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-[#082f6b]">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          AR Career Point Performance Report
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          मॉक टेस्ट परिणाम एवं विश्लेषण
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {testTitle}
        </p>
      </div>

      {/* Main Score & Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Circular Score Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-2 sm:p-4">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Colored Progress Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={percentage >= 50 ? '#10b981' : '#f59e0b'}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {percentage}%
                </span>
                <span className="text-xs font-bold text-slate-500 mt-0.5">
                  स्कोर: {score} / {maxScore}
                </span>
              </div>
            </div>

            <div className={`mt-3 sm:mt-4 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black border ${motivationalColor}`}>
              {motivationalBadge}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              समय लगा: {timeFormatted}
            </p>
          </div>

          {/* Detailed Statistics Table */}
          <div className="md:col-span-7 space-y-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-600 uppercase tracking-wider mb-2">
              Result Breakdown (विस्तृत विवरण)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs font-semibold">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  कुल प्रश्न
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-800 mt-1">{totalQuestions}</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] sm:text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  सही उत्तर
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">{correct}</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-1.5 text-red-700 text-[11px] sm:text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  गलत उत्तर
                </div>
                <div className="text-lg sm:text-xl font-black text-red-700 mt-1">{wrong}</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs font-semibold">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  अनुत्तरित
                </div>
                <div className="text-lg sm:text-xl font-black text-slate-700 mt-1">{unanswered}</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-1.5 text-blue-700 text-[11px] sm:text-xs font-semibold">
                  <Trophy className="w-3.5 h-3.5 text-blue-600" />
                  प्राप्त अंक
                </div>
                <div className="text-lg sm:text-xl font-black text-[#082f6b] mt-1">{score} अंक</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-1.5 text-amber-700 text-[11px] sm:text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  सटीकता (Accuracy)
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-800 mt-1">
                  {correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0}%
                </div>
              </div>
            </div>

            <button type="button" onClick={() => void startTestById(currentResult.testId)} className="mt-4 text-sm font-bold text-blue-700 underline">Leaderboard &amp; your attempts</button>
            {/* Quick Action Buttons */}
            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="py-2.5 px-4 bg-[#082f6b] hover:bg-[#0b3d8a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAnswerKey ? 'उत्तर कुंजी छिपाएं' : 'Answer Key देखें'}</span>
              </button>

              <button
                onClick={retakeCurrentTest}
                className="py-2.5 px-4 bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:brightness-105 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>दोबारा टेस्ट दें (Retake)</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Dashboard में देखें</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Answer Key & Explanation Accordion */}
      {showAnswerKey && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Answer Key & Detailed Explanations
              </h2>
              <p className="text-xs text-slate-500">
                प्रत्येक प्रश्न का सही उत्तर एवं विषय विशेषज्ञों द्वारा तैयार व्याख्या
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {questions.length} प्रश्न
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
                          सही (+{q.marks ?? 1})
                        </span>
                      )}
                      {!isCorrect && !isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          गलत (-{q.negativeMarks ?? 0.25})
                        </span>
                      )}
                      {isSkipped && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-200 text-slate-700">
                          छोड़ा गया (0.00)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User's response vs Correct answer */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200">
                      <span className="font-bold text-slate-500 block mb-0.5">आपका उत्तर:</span>
                      <span className={`font-semibold ${
                        isCorrect ? 'text-emerald-700' : isSkipped ? 'text-slate-500' : 'text-red-600'
                      }`}>
                        {isSkipped
                          ? 'उत्तर नहीं दिया (Not Attempted)'
                          : `${['A', 'B', 'C', 'D'][selectedIdx]}. ${q.options[selectedIdx]?.text}`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200">
                      <span className="font-bold text-emerald-700 block mb-0.5">सही उत्तर:</span>
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
                        समाधान एवं व्याख्या (Explanation):
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

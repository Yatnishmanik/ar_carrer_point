'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  CheckCircle2,
  FileQuestion,
  TrendingUp,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

export const StudentDashboardView: React.FC = () => {
  const {
    attemptsHistory,
    currentUser,
    startTestById,
    reviewAttempt,
    t,
  } = useApp();

  const totalTests = attemptsHistory.length;
  const totalCorrect = attemptsHistory.reduce((acc, h) => acc + h.correct, 0);
  const totalQuestions = attemptsHistory.reduce((acc, h) => acc + h.totalQuestions, 0);
  const avgPercentage =
    totalTests > 0
      ? Math.round(attemptsHistory.reduce((acc, h) => acc + h.percentage, 0) / totalTests)
      : 0;

  const handleReviewAttempt = (attempt: (typeof attemptsHistory)[0]) => {
    void reviewAttempt(attempt.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#082f6b] to-[#0966df] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl font-black">
              🎓
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-900 mb-1">
                <Sparkles className="w-3 h-3" />
                {t('Student Portal')}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentUser?.name || t('Student Dashboard')}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                {t('Target Exam')}: {currentUser?.targetExam || 'Bihar Board Class 10th'}
              </p>
            </div>
          </div>

          <button
            onClick={() => startTestById()}
            className="px-5 py-3 bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:brightness-105 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>{t('Start a new test')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('Total Tests')}</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
            {totalTests}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{t('Completed successfully')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('Correct')}</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {totalCorrect}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{t('Number of correct answers')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('Total Questions')}</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">
            {totalQuestions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{t('Sum of questions attempted')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t('Average Score')}</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {avgPercentage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{t('Overall performance rate')}</div>
        </div>
      </div>

      {/* Recent Tests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {t('Recent Test History')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('Record of your online tests')}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {totalTests} {t('records')}
          </span>
        </div>

        {attemptsHistory.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-2xl">
              📝
            </div>
            <h3 className="text-base font-bold text-slate-700">
              {t('No attempts yet.')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {t('Choose an online test')}
            </p>
            <button
              onClick={() => startTestById()}
              className="px-5 py-2.5 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {t('Start Test')}
            </button>
          </div>
        ) : (
          <div>
            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden space-y-3">
              {attemptsHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                      {h.testTitle}
                    </h3>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        h.percentage >= 60
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {h.percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {h.timestamp ? h.timestamp.split('T')[0] : t('Recently')}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {t('Score')}: {h.score} / {h.maxScore}
                    </span>
                  </div>

                  <button
                    onClick={() => handleReviewAttempt(h)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-blue-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('View Result & Analysis')}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-3 px-4 rounded-l-xl">{t('Test Name')}</th>
                    <th className="py-3 px-3">{t('Date')}</th>
                    <th className="py-3 px-3">{t('Score')}</th>
                    <th className="py-3 px-3">{t('Percentage')}</th>
                    <th className="py-3 px-4 rounded-r-xl text-right">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attemptsHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {h.testTitle}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {h.timestamp ? h.timestamp.split('T')[0] : t('Recently')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {h.score} / {h.maxScore}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            h.percentage >= 60
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {h.percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleReviewAttempt(h)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{t('View Result')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

'use client';

import React from 'react';
import { Test } from '../types';
import { useApp } from '../context/AppContext';

interface TestCardProps {
  test: Test;
}

export const TestCard: React.FC<TestCardProps> = ({ test }) => {
  const { startTestById, t, showToast } = useApp();

  const handleSyllabusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`${test.title} - Syllabus Info`, 'info');
  };

  const questionCount = test.questionCount ?? (test.questions ? test.questions.length : 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Body */}
      <div className="p-4 sm:p-5">
        {/* FREE Badge */}
        <div className="mb-2.5">
          <span className="inline-block px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white bg-[#4caf50] rounded-[3px] shadow-xs">
            {t('FREE')}
          </span>
        </div>

        {/* Test Title */}
        <h3 
          onClick={() => startTestById(test.id)}
          className="text-[15px] sm:text-base font-bold text-slate-800 leading-snug hover:text-blue-600 cursor-pointer transition-colors line-clamp-2"
          title={test.title}
        >
          {t(test.title)}
        </h3>

        {/* Subtitle if present */}
        {test.subtitle && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {t(test.subtitle)}
          </p>
        )}

        {/* Specs and Start Test Link */}
        <div className="flex items-center justify-between gap-2 mt-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>{questionCount} Qs</span>
            <span>.</span>
            <span>{test.durationMinutes} mins</span>
            <span>.</span>
            <span>{test.totalMarks} Marks</span>
          </div>

          <button
            onClick={() => startTestById(test.id)}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-[#1976d2] hover:text-[#0d47a1] hover:underline shrink-0 transition-colors ml-auto"
          >
            <span>{t('Start Test')}</span>
            <span className="text-sm font-black leading-none">→</span>
          </button>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#f8fbff] border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={handleSyllabusClick}
          className="text-xs font-medium text-[#4a90e2] hover:text-blue-700 hover:underline transition-colors cursor-pointer"
        >
          {t('Syllabus Info')}
        </button>

        {test.category && (
          <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[150px]">
            {t(test.category)}
          </span>
        )}
      </div>
    </div>
  );
};


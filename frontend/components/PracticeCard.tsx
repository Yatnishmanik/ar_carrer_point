'use client';

import React from 'react';
import { PracticeSet } from '../types';
import { useApp } from '../context/AppContext';
import { FileText, Clock, PlayCircle, Download } from 'lucide-react';

interface PracticeCardProps {
  practice: PracticeSet;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({ practice }) => {
  const { startTestById, showToast } = useApp();

  const handleStart = () => {
    startTestById();
  };

  const handleDownload = () => {
    showToast(`"${practice.title}" का PDF डाउनलोड प्रारंभ हो रहा है...`, 'success');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-blue-400/80 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left side info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border border-red-200/80 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate">
            {practice.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{practice.subject}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {practice.durationMinutes} Min
            </span>
            <span>•</span>
            <span>{practice.questionsCount} Questions</span>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Free
        </span>

        <button
          onClick={handleDownload}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          title="Download PDF Paper"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleStart}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm transition-all"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Start Test</span>
        </button>
      </div>
    </div>
  );
};

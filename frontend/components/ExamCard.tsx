'use client';

import React from 'react';
import { ExamCategory } from '../types';
import { useApp } from '../context/AppContext';
import { Check, ArrowRight, BookOpen } from 'lucide-react';

interface ExamCardProps {
  exam: ExamCategory;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const { tests, startTestById, showToast } = useApp();

  const handleStart = () => {
    const test = tests.find(test => test.categoryId === exam.id);
    if (test) void startTestById(test.id);
    else showToast('No published test is available for this exam yet.', 'info');
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Top Gradient Banner */}
      <div
        className="h-20 w-full flex items-center justify-between px-5 relative overflow-hidden"
        style={{ background: exam.gradient }}
      >
        <span className="text-4xl filter drop-shadow select-none group-hover:scale-110 transition-transform duration-300">
          {exam.icon}
        </span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-black/20 text-white backdrop-blur-md border border-white/20 uppercase tracking-wider">
          {exam.code}
        </span>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug group-hover:text-blue-700 transition-colors">
            {exam.name}
          </h3>

          <div className="flex items-center gap-2 mt-1 mb-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
              <BookOpen className="w-3.5 h-3.5" />
              {exam.testCount}+ Mocks
            </span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">100% Free</span>
          </div>

          {/* Bulleted syllabus / test highlights */}
          <ul className="space-y-1.5 mb-4 text-xs text-slate-600">
            {exam.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full mt-auto py-2.5 px-4 bg-gradient-to-r from-[#082f6b] to-[#0966df] hover:from-[#0b3d8a] hover:to-[#1775f0] text-white text-xs font-bold rounded-xl shadow-xs group-hover:shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>टेस्ट शुरू करें</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

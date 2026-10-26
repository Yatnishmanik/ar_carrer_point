'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ChevronRight, Sparkles } from 'lucide-react';

export const UpdatesTicker: React.FC = () => {
  const { updates, startTestById } = useApp();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            🔔 Latest Exam Updates
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
          Live Notice Board
        </span>
      </div>

      <div className="space-y-3">
        {updates.map((up) => (
          <div
            key={up.id}
            onClick={() => startTestById()}
            className="group p-3 rounded-xl hover:bg-blue-50/60 border border-transparent hover:border-blue-100 cursor-pointer transition-all duration-150 flex items-start gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-[#0966df] mt-2 shrink-0 group-hover:scale-125 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 leading-snug">
                  {up.title}
                </p>
                {up.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 border border-red-200 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {up.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {up.date}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
          </div>
        ))}
      </div>
    </div>
  );
};

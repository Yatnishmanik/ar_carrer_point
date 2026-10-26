'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Users,
  FileCheck2,
} from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { startTestById, setActiveTab } = useApp();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#062453] via-[#082f6b] to-[#0b4d9e] text-white py-8 sm:py-12 md:py-16">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ffcf94] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">AR Career Point Official Test Portal</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.2]">
              परीक्षा की तैयारी <br className="hidden sm:inline" />
              अब और भी <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffcf94] via-amber-300 to-orange-400">आसान व सटीक</span>
            </h1>

            <p className="text-sm sm:text-lg text-blue-100 font-normal max-w-xl leading-relaxed">
              Bihar Board (10th & 12th), Railway NTPC, SSC GD और BPSC के लिए उच्च गुणवत्ता वाले 
              फ्री ऑनलाइन मॉक टेस्ट, चैप्टर-वाइज क्विज और विस्तृत व्याख्या सहित उत्तर।
            </p>

            {/* Feature Checklist */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-x-5 sm:gap-y-2.5 pt-1 text-xs sm:text-sm text-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Free Practice</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>चैप्टर वाइज टेस्ट</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PYQ पिछले वर्ष प्रश्न</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>तत्काल स्कोर व रैंक</span>
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 sm:pt-3">
              <button
                onClick={() => startTestById()}
                className="group px-6 py-3.5 bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:from-[#ea580c] hover:to-[#d04603] text-white text-sm sm:text-base font-extrabold rounded-xl shadow-lg shadow-orange-900/30 hover:shadow-orange-700/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>टेस्ट शुरू करें (Start Test)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 text-sm font-bold rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <span>अभ्यास सेट देखें</span>
              </button>
            </div>

            {/* Live Trust Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-blue-800/60 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white">50K+</div>
                  <div className="text-[10px] sm:text-[11px] text-blue-200">विद्यार्थी</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                  <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white">1,500+</div>
                  <div className="text-[10px] sm:text-[11px] text-blue-200">प्रश्न बैंक</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white">98%</div>
                  <div className="text-[10px] sm:text-[11px] text-blue-200">सफलता</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Art & Floating Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[300px] overflow-hidden sm:overflow-visible py-4 sm:py-0">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-square flex items-center justify-center">
              
              {/* Outer decorative ring */}
              <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-dashed border-white/10" />

              {/* Big Central Emblem */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-[#082f6b] to-[#1259c4] p-1 shadow-2xl border border-white/30 flex flex-col items-center justify-center text-center backdrop-blur-xl">
                <span className="text-5xl sm:text-6xl drop-shadow-md select-none">🎓</span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide mt-2">AR CAREER POINT</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300">Online Examination</span>
              </div>

              {/* Floating Glass Pill 1: Practice */}
              <div className="absolute top-0 right-0 sm:-top-1 sm:-right-2 bg-white/95 text-[#082f6b] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 animate-float backdrop-blur-md">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs font-black">✓ Regular Practice</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500">हर दिन नया टेस्ट</div>
                </div>
              </div>

              {/* Floating Glass Pill 2: Analyze */}
              <div className="absolute top-1/2 left-0 sm:-left-4 -translate-y-1/2 bg-white/95 text-[#082f6b] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 animate-float-delayed backdrop-blur-md">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs font-black">◉ Smart Analysis</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500">कमजोर विषयों पर पकड़</div>
                </div>
              </div>

              {/* Floating Glass Pill 3: Improve */}
              <div className="absolute bottom-0 right-1 sm:-bottom-2 sm:right-4 bg-white/95 text-[#082f6b] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 animate-float backdrop-blur-md">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs font-black">↗ Better Results</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500">बोर्ड में टॉप रैंक</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

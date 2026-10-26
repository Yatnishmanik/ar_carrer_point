'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, BookOpen, Heart, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [currentYear, setCurrentYear] = React.useState(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#051c42] text-slate-300 pt-10 sm:pt-12 pb-24 md:pb-8 border-t border-blue-900/60 mt-12 sm:mt-16 pb-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-blue-900/50 text-xs sm:text-sm">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg border border-white/20">
                AR
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">
                  <span className="text-red-500">AR</span> Career Point
                </span>
                <p className="text-[11px] text-blue-200">
                  Your Success, Our Mission · Online Test Platform
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              बिहार बोर्ड कक्षा 10वीं व 12वीं, रेलवे, एसएससी और प्रतियोगी परीक्षाओं के लिए 
              विश्वसनीय एवं नवीनतम पैटर्न पर आधारित फ्री ऑनलाइन मॉक टेस्ट और अध्ययन सामग्री।
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>लाखों छात्रों का भरोसेमंद ऑनलाइन प्लेटफॉर्म</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-extrabold text-sm mb-3 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => { setActiveTab('home'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  ⌂ Home (मुख्य पृष्ठ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  ▣ All Online Tests
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('practice'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  ▤ Practice Sets & PDFs
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('dashboard'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  ◷ Student Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Exams */}
          <div>
            <h4 className="text-white font-extrabold text-sm mb-3 uppercase tracking-wider">
              Target Exams
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  • Bihar Board Matric (10th)
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  • Bihar Board Inter (12th)
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  • Railway RRB NTPC
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  • SSC GD Constable
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setActiveTab('tests'); scrollToTop(); }}
                  className="hover:text-white transition-colors"
                >
                  • 71st BPSC CCE & SI
                </button>
              </li>
            </ul>
          </div>

          {/* Admin & Support */}
          <div>
            <h4 className="text-white font-extrabold text-sm mb-3 uppercase tracking-wider">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => { setActiveTab('admin'); scrollToTop(); }}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  ⚙ Admin Management
                </button>
              </li>
              <li className="text-slate-400">
                Backend: Node.js + Express
              </li>
              <li className="text-slate-400">
                Database: PostgreSQL + Prisma
              </li>
              <li className="text-slate-400">
                Frontend: Next.js 16 + React 19
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {currentYear} <span className="text-white font-bold">AR Career Point</span>. All Rights Reserved.
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for Students
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-blue-900/40 hover:bg-blue-800 text-white transition-colors"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

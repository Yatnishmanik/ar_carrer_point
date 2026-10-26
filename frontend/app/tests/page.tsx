'use client';

import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Navbar } from '../../components/Navbar';
import { ExamCard } from '../../components/ExamCard';
import { Footer } from '../../components/Footer';
import { AuthModal } from '../../components/AuthModal';
import { Clock, ArrowRight } from 'lucide-react';

export default function TestsPage() {
  const { tests, exams, searchQuery, startTestById, setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('tests');
  }, [setActiveTab]);

  const filteredTests = tests.filter((t) => {
    if (!searchQuery.trim()) return true;
    return (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-[#082f6b]">
            All Online Tests
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            ऑनलाइन टेस्ट एवं मॉक टेस्ट श्रृंखला
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Bihar Board (10th/12th), Railway NTPC, SSC GD और BPSC के लिए तैयार विशेष टेस्ट
          </p>
        </div>

        {/* Tests List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {test.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    100% Free
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {test.subtitle}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {test.durationMinutes} मिनट
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    {test.questions.length} प्रश्न
                  </span>
                  <span>•</span>
                  <span className="font-medium text-blue-700">
                    {test.totalMarks} अंक
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  नेगेटिव मार्किंग: 0.25
                </span>
                <button
                  onClick={() => startTestById(test.id)}
                  className="px-4 py-2 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Categories Grid */}
        <div className="pt-4">
          <h2 className="text-lg font-black text-slate-900 mb-4">
            Exam Categories (कैटेलॉग)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      </main>

      <AuthModal />
      <Footer />
    </div>
  );
}

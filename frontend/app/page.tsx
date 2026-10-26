'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { ExamCard } from '../components/ExamCard';
import { PracticeCard } from '../components/PracticeCard';
import { UpdatesTicker } from '../components/UpdatesTicker';
import { QuizEngine } from '../components/QuizEngine';
import { ResultCard } from '../components/ResultCard';
import { StudentDashboardView } from '../components/StudentDashboardView';
import { AdminQuestionManager } from '../components/AdminQuestionManager';
import { AuthModal } from '../components/AuthModal';
import { Footer } from '../components/Footer';
import {
  Layers,
  ArrowRight,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    exams,
    practiceSets,
    tests,
    searchQuery,
    setSearchQuery,
    startTestById,
    toast,
    hideToast,
  } = useApp();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filter exams based on category filter and search query
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      !searchQuery.trim() ||
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.items.some((it) => it.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || exam.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Filter tests list
  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      <Navbar />

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[#082f6b] text-white rounded-2xl shadow-2xl border border-blue-400/40 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[calc(100vw-24px)]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-semibold">{toast.message}</span>
          <button
            onClick={hideToast}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area switching by activeTab */}
      <main className="flex-1 pb-16 md:pb-0">
        
        {/* TAB 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-12 pb-16">
            <HeroBanner />

            {/* Popular Tests Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Popular Online Tests (लोकप्रिय ऑनलाइन टेस्ट)
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    बोर्ड परीक्षा व प्रतियोगी परीक्षाओं के लिए विशेष रूप से तैयार फ्री टेस्ट
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('tests')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0966df] hover:text-[#082f6b] group self-start sm:self-auto"
                >
                  <span>सभी टेस्ट देखें (View All)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Grid of Exam Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </section>

            {/* Lower Grid: Practice Sets & Latest Updates */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Practice Sets List (Col 7) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          Latest Practice Sets (नवीनतम अभ्यास सेट)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          अध्याय-वार एवं विषय-वार मॉडल प्रश्न पत्र
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('practice')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {practiceSets.slice(0, 4).map((practice) => (
                      <PracticeCard key={practice.id} practice={practice} />
                    ))}
                  </div>
                </div>

                {/* Latest Updates & Notice Board (Col 5) */}
                <div className="lg:col-span-5">
                  <UpdatesTicker />
                </div>

              </div>
            </section>
          </div>
        )}

        {/* TAB 2: ONLINE TESTS CATALOG */}
        {activeTab === 'tests' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-[#082f6b]">
                All Online Tests
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                ऑनलाइन टेस्ट एवं मॉक टेस्ट श्रृंखला
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                अपनी लक्षित परीक्षा चुनें और तुरंत रियल-टाइम टाइमर व रिजल्ट के साथ फ्री टेस्ट शुरू करें।
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar px-1">
              {[
                { id: 'all', label: 'All Exams (सभी परीक्षाएं)' },
                { id: 'bihar-board', label: 'Bihar Board (10th/12th)' },
                { id: 'competitive', label: 'Railway & SSC & BPSC' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategoryFilter(chip.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === chip.id
                      ? 'bg-[#082f6b] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search query feedback */}
            {searchQuery && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <span>
                  खोज परिणाम: <b>&quot;{searchQuery}&quot;</b>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="font-bold underline hover:text-blue-700"
                >
                  सर्च साफ करें
                </button>
              </div>
            )}

            {/* Tests List & Cards */}
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

            {/* Exam Categories Overview */}
            <div className="pt-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">
                Exam Categories (कैटेलॉग)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICE SETS & PDF PAPERS */}
        {activeTab === 'practice' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                Practice Bank & PDFs
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Practice Sets एवं मॉडल पेपर्स
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                चैप्टर-वाइज प्रश्न सेट और पिछले वर्षों के प्रश्न पत्र डाउनलोड करें या ऑनलाइन हल करें।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {practiceSets.map((practice) => (
                <PracticeCard key={practice.id} practice={practice} />
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE QUIZ ENGINE */}
        {activeTab === 'quiz' && <QuizEngine />}

        {/* TAB 5: TEST RESULT & DETAILED ANALYSIS */}
        {activeTab === 'result' && <ResultCard />}

        {/* TAB 6: STUDENT DASHBOARD */}
        {activeTab === 'dashboard' && <StudentDashboardView />}

        {/* TAB 7: ADMIN PANEL */}
        {activeTab === 'admin' && <AdminQuestionManager />}

      </main>

      {/* Auth Login/Signup Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
}

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
import { ToastNotification } from '../components/ToastNotification';
import { TestCard } from '../components/TestCard';
import {
  ArrowRight,
  BookOpen,
  Clock,
} from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    activeTest,
    loading,
    error,
    refreshData,
    authModalTab,
    setActiveTab,
    exams,
    practiceSets,
    tests,
    searchQuery,
    setSearchQuery,
    startTestById,
    t,
  } = useApp();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const isExamMode = activeTab === 'quiz' && Boolean(activeTest);

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
    const testCategory = exams.find((exam) => exam.id === t.categoryId)?.category;
    const matchesCategory =
      selectedCategoryFilter === 'all' || testCategory === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navigation */}
      {!isExamMode && <Navbar />}

      <ToastNotification />

      {/* Main Content Area switching by activeTab */}
      <main className={isExamMode ? 'min-h-0 flex-1' : 'flex-1 pb-16 md:pb-0'}>
        {!isExamMode && loading && <p role="status" className="p-6 text-center">{t('Loading')}</p>}
        {!isExamMode && error && <div role="alert" className="p-6 text-center text-red-700">{t('Could not load the platform:')} {error} <button className="underline" onClick={() => void refreshData()}>{t('Retry')}</button></div>}
        
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
                      {t('Popular Online Tests')}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {t('Special free tests for board and competitive exam preparation')}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('tests')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#0966df] hover:text-[#082f6b] group self-start sm:self-auto"
                >
                  <span>{t('View All')}</span>
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
                          {t('Latest Practice Sets')}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {t('Chapter-wise and subject-wise model papers')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('practice')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      {t('View All')} →
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
                {t('All Online Tests')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t('Online test and mock test series')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {t('Choose your target exam and start a free test with a timer and instant results.')}
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar px-1">
              {[
                { id: 'all', label: t('All Exams') },
                { id: 'bihar-board', label: t('Bihar Board (10th/12th)') },
                { id: 'competitive', label: t('Railway, SSC and BPSC') },
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
                  {t('Search results:')} <b>&quot;{searchQuery}&quot;</b>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="font-bold underline hover:text-blue-700"
                >
                  {t('Clear search')}
                </button>
              </div>
            )}

            {/* FREE TEST Section Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {t('FREE TEST')}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {filteredTests.length} {t('Tests Available')}
              </span>
            </div>

            {/* Tests List & Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>

            {/* Exam Categories Overview */}
            <div className="pt-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">
                {t('Exam Categories')}
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
                {t('Practice Bank & PDFs')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t('Practice Sets and Model Papers')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {t('Browse chapter-wise question sets and download previous-year papers or take an online test.')}
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
        {activeTab === 'quiz' && (activeTest ? <QuizEngine key={`${activeTest.id}-${activeTest.startedAt}`} /> : <div className="p-12 text-center">{t('Select a test to begin.')} <button className="underline" onClick={() => setActiveTab('tests')}>{t('Browse tests')}</button></div>)}

        {/* TAB 5: TEST RESULT & DETAILED ANALYSIS */}
        {activeTab === 'result' && <ResultCard />}

        {/* TAB 6: STUDENT DASHBOARD */}
        {activeTab === 'dashboard' && <StudentDashboardView />}

        {/* TAB 7: ADMIN PANEL */}
        {activeTab === 'admin' && <AdminQuestionManager />}

      </main>

      {/* Auth Login/Signup Modal */}
      <AuthModal key={authModalTab} />

      {/* Footer */}
      {!isExamMode && <Footer />}
    </div>
  );
}

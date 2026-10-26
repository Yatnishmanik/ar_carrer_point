'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Question } from '../types';
import {
  ShieldAlert,
  PlusCircle,
  Trash2,
  BookOpen,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminQuestionManager: React.FC = () => {
  const {
    questions,
    addQuestionToBank,
    deleteQuestionFromBank,
    showToast,
    tests,
  } = useApp();

  const [category, setCategory] = useState('Bihar Board Class 10th - Science');
  const [subject, setSubject] = useState('General Science');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      showToast('कृपया प्रश्न दर्ज करें', 'error');
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showToast('कृपया चारों विकल्प भरें', 'error');
      return;
    }

    const newQuestion: Question = {
      id: `q-custom-${Date.now()}`,
      questionText: questionText.trim(),
      options: [
        { id: 'opt0', text: optA.trim() },
        { id: 'opt1', text: optB.trim() },
        { id: 'opt2', text: optC.trim() },
        { id: 'opt3', text: optD.trim() },
      ],
      correctOptionIndex,
      explanation: explanation.trim() || undefined,
      subject: subject.trim(),
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
    };

    addQuestionToBank(newQuestion, category);

    // Reset form fields
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#082f6b] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-amber-300 border border-white/15 mb-1">
                <Sparkles className="w-3 h-3" />
                Control Center
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Admin Panel · Question & Test Management
              </h1>
              <p className="text-xs text-slate-300">
                Manage questions bank, create mock sets, and prepare tests for Prisma + PostgreSQL backend
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 border border-white/20 text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              {questions.length} Questions in Bank
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form: Add Question */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              नया प्रश्न जोड़ें (Add Question)
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  परीक्षा / कैटेगरी (Test Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
                >
                  <option value="Bihar Board Class 10th - Science">Bihar Board Class 10th - Science</option>
                  <option value="Bihar Board Class 12th">Bihar Board Class 12th</option>
                  <option value="Railway NTPC">Railway NTPC / Group D</option>
                  <option value="SSC GD">SSC GD Constable</option>
                  <option value="BPSC">BPSC / Bihar SI</option>
                  <option value="General Studies">General Studies & Current Affairs</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  विषय (Subject)
                </label>
                <input
                  type="text"
                  placeholder="उदा. Physics, Hindi, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                प्रश्न का विवरण (Question Text in Hindi / English) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="यहाँ अपना प्रश्न टाइप करें..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Option A *</label>
                <input
                  required
                  type="text"
                  placeholder="विकल्प A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Option B *</label>
                <input
                  required
                  type="text"
                  placeholder="विकल्प B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Option C *</label>
                <input
                  required
                  type="text"
                  placeholder="विकल्प C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Option D *</label>
                <input
                  required
                  type="text"
                  placeholder="विकल्प D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Correct Option & Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  सही उत्तर (Correct Option)
                </label>
                <select
                  value={correctOptionIndex}
                  onChange={(e) => setCorrectOptionIndex(Number(e.target.value))}
                  className="w-full p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold outline-none"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">अंक (Marks)</label>
                <input
                  type="number"
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">नेगेटिव (Penalty)</label>
                <input
                  type="number"
                  step="0.05"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                समाधान एवं व्याख्या (Explanation / Solution notes)
              </label>
              <textarea
                rows={2}
                placeholder="प्रश्न का विस्तृत उत्तर व स्पष्टीकरण यहाँ लिखें..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0966df] hover:bg-[#0b55bb] text-white font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>प्रश्न बैंक में जोड़ें (Add to Test Bank)</span>
            </button>
          </form>
        </div>

        {/* Current Questions List */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                वर्तमान प्रश्न बैंक (Questions)
              </h2>
              <p className="text-xs text-slate-500">कुल {questions.length} प्रश्न उपलब्ध हैं</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-slate-800 line-clamp-2">
                    <span className="text-blue-600 mr-1.5">#{idx + 1}</span>
                    {q.questionText}
                  </div>
                  <button
                    onClick={() => deleteQuestionFromBank(q.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Remove Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-emerald-700 font-bold">
                    सही उत्तर: {['A', 'B', 'C', 'D'][q.correctOptionIndex]} ({q.options[q.correctOptionIndex]?.text})
                  </span>
                  {q.subject && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {q.subject}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

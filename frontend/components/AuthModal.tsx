'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, ShieldAlert, GraduationCap, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, loginUser, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('Bihar Board Class 10th');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('कृपया ईमेल और पासवर्ड भरें', 'error');
      return;
    }
    loginUser(email.trim(), 'student', name.trim() || undefined);
  };

  const handleQuickDemo = (role: 'student' | 'admin') => {
    if (role === 'admin') {
      loginUser('admin@arcareerpoint.com', 'admin', 'प्रशासनिक अधिकारी (Admin)');
    } else {
      loginUser('student.demo@arcareerpoint.com', 'student', 'राहुल शर्मा (Student)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#082f6b] to-[#0966df] text-white flex items-center justify-center text-xl font-black mx-auto mb-2 shadow-md">
            AR
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login' ? 'Student Login' : 'Create Free Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AR Career Point ऑनलाइन टेस्ट व रिजल्ट पोर्टल
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
          {mode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="उदा. राहुल कुमार"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">ईमेल या मोबाइल नंबर</label>
            <div className="relative">
              <input
                required
                type="text"
                placeholder="email@example.com या 9876543210"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">पासवर्ड</label>
            <div className="relative">
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">मुख्य परीक्षा (Target Exam)</label>
              <div className="relative">
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
                >
                  <option value="Bihar Board Class 10th">Bihar Board Class 10th (Matric)</option>
                  <option value="Bihar Board Class 12th">Bihar Board Class 12th (Inter)</option>
                  <option value="Railway NTPC / Group D">Railway NTPC / Group D</option>
                  <option value="SSC GD">SSC GD Constable</option>
                  <option value="BPSC / Bihar SI">BPSC / Bihar SI</option>
                </select>
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#0966df] hover:bg-[#0b55bb] text-white font-black rounded-xl shadow-md transition-colors text-xs sm:text-sm mt-2"
          >
            {mode === 'login' ? 'Login करें' : 'अकाउंट बनाएं'}
          </button>
        </form>

        {/* Quick Demo Mode Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            या एक क्लिक में डेमो एक्सेस करें:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('student')}
              className="p-2.5 rounded-xl bg-blue-50 text-[#082f6b] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo Student</span>
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="p-2.5 rounded-xl bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 border border-amber-200"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

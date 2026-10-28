'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, GraduationCap } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, loginUser, showToast } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalTab);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('Bihar Board Class 10th');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('कृपया ईमेल और पासवर्ड भरें', 'error');
      return;
    }
    if (busy) return;
    setBusy(true);
    try { await loginUser(email.trim(), password, mode === 'signup' ? name.trim() : undefined, targetExam); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Login failed', 'error'); }
    finally { setBusy(false); }
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
              <label htmlFor="auth-name" className="block font-bold text-slate-700 mb-1">पूरा नाम (Full Name)</label>
              <div className="relative">
                <input
                  required
                  id="auth-name"
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
            <label htmlFor="auth-email" className="block font-bold text-slate-700 mb-1">ईमेल (Email)</label>
            <div className="relative">
              <input
                required
                id="auth-email"
                  type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block font-bold text-slate-700 mb-1">पासवर्ड</label>
            <div className="relative">
              <input
                required
                id="auth-password"
                  type="password"
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
            disabled={busy}
            className="w-full py-3 bg-[#0966df] hover:bg-[#0b55bb] text-white font-black rounded-xl shadow-md transition-colors text-xs sm:text-sm mt-2"
          >
            {mode === 'login' ? 'Login करें' : 'अकाउंट बनाएं'}
          </button>
        </form>


      </div>
    </div>
  );
};

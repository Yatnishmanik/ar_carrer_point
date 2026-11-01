'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../lib/api';
import { X, Lock, Mail, User } from 'lucide-react';

type Availability = 'available' | 'taken' | 'checking' | 'invalid' | 'error';
function useAvailability(field: 'username' | 'email', value: string, enabled: boolean): Availability {
  const normalized = value.trim().toLowerCase();
  const valid = field === 'username' ? /^[a-z0-9_]{3,30}$/.test(normalized) : normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const [result, setResult] = useState<{ value: string; status: Availability } | null>(null);
  useEffect(() => {
    if (!enabled || !valid) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      apiService.checkAvailability(field, normalized, controller.signal)
        .then(data => { if (!controller.signal.aborted) setResult({ value: normalized, status: data.available ? 'available' : 'taken' }); })
        .catch(() => { if (!controller.signal.aborted) setResult({ value: normalized, status: 'error' }); });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [field, normalized, enabled, valid]);
  if (!valid) return 'invalid';
  return result?.value === normalized ? result.status : 'checking';
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab } = useApp();
  return isAuthModalOpen ? <AuthForm key={authModalTab} /> : null;
};

const AuthForm: React.FC = () => {
  const { closeAuthModal, authModalTab, loginUser, showToast, t } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalTab);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const usernameStatus = useAvailability('username', name, mode === 'signup');
  const emailStatus = useAvailability('email', email, mode === 'signup');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast(t('Enter your username or email and password.'), 'error');
      return;
    }
    if (busy || (mode === 'signup' && (usernameStatus !== 'available' || emailStatus !== 'available'))) return;
    setBusy(true);
    try { await loginUser(email.trim(), password, mode === 'signup' ? name.trim() : undefined); }
    catch (error) { showToast(error instanceof Error ? error.message : t('Login failed'), 'error'); }
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
            {mode === 'login' ? t('Student Login') : t('Create Free Account')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('AR Career Point online test and results portal')}
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
            {t('Login')}
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('Sign Up')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block font-bold text-slate-700 mb-1">{t('Username')}</label>
              <div className="relative">
                <input
                  required
                  id="auth-name"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]{3,30}"
                  type="text"
                  placeholder={t('Example: rahul_kumar')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p aria-live="polite" className={`mt-1 text-xs ${usernameStatus === 'taken' || usernameStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                {t(!name ? 'Use 3–30 letters, numbers, or underscores.' : usernameStatus === 'available' ? 'Username is available.' : usernameStatus === 'taken' ? 'Username is already taken.' : usernameStatus === 'checking' ? 'Checking availability...' : usernameStatus === 'error' ? 'Could not check availability. Edit the field to retry.' : 'Use 3–30 letters, numbers, or underscores.')}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block font-bold text-slate-700 mb-1">{mode === 'signup' ? t('Email') : t('Username or email')}</label>
            <div className="relative">
              <input
                required
                id="auth-email"
                  type={mode === 'signup' ? 'email' : 'text'}
                maxLength={254}
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                placeholder={mode === 'signup' ? 'email@example.com' : t('Username or email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode === 'signup' && email && <p aria-live="polite" className={`text-xs ${emailStatus === 'taken' || emailStatus === 'error' || emailStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'}`}>
            {t(emailStatus === 'available' ? 'Email is available.' : emailStatus === 'taken' ? 'Email is already registered.' : emailStatus === 'checking' ? 'Checking availability...' : emailStatus === 'error' ? 'Could not check availability. Edit the field to retry.' : 'Enter a valid email address.')}
          </p>}

          <div>
            <label htmlFor="auth-password" className="block font-bold text-slate-700 mb-1">{t('Password')}</label>
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

          <button
            type="submit"
            disabled={busy || (mode === 'signup' && (usernameStatus !== 'available' || emailStatus !== 'available'))}
            className="w-full py-3 bg-[#0966df] hover:bg-[#0b55bb] text-white font-black rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm mt-2"
          >
            {mode === 'login' ? t('Login') : t('Create account')}
          </button>
        </form>


      </div>
    </div>
  );
};

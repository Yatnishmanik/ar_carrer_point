'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
  Clock,
  User,
  ShieldAlert,
  LogIn,
  LogOut,
  Menu,
  X,
  FileText,
  Sparkles,
  ChevronDown,
  Languages,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    currentUser,
    setTestFilter,
    openAuthModal,
    logoutUser,
    language,
    setLanguage,
    t,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('tests');
    }
  };

  const navLinks = [
    { id: 'home', label: t('Home'), icon: BookOpen, width: 'w-[75px]' },
    { id: 'tests', label: t('Online Test'), icon: Layers, width: 'w-[115px]' },
    { id: 'practice', label: t('Practice Set'), icon: FileText, width: 'w-[105px]' },
    { id: 'bihar-board', label: t('Bihar Board (10th/12th)'), icon: GraduationCap, width: 'w-[165px]' },
    { id: 'dashboard', label: t('Student Dashboard'), icon: User, width: 'w-[145px]' },
    { id: 'admin', label: t('Admin Panel'), icon: ShieldAlert, badge: 'Staff', width: 'w-[162px]' },
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === 'bihar-board') {
      setTestFilter(tabId);
      setActiveTab('tests');
    } else if (tabId === 'tests') {
      setTestFilter('all');
      setActiveTab('tests');
    } else {
      setActiveTab(tabId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs backdrop-blur-md">
        {/* Top Banner Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            {/* Brand Logo & Title */}
            <div
              onClick={() => handleNavClick('home')}
              className="flex w-[210px] sm:w-[300px] items-center gap-2.5 sm:gap-3.5 cursor-pointer group flex-shrink-0"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#082f6b] to-[#0966df] text-white flex items-center justify-center font-black text-base sm:text-xl shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform duration-200 border border-white/60 ring-2 ring-blue-500/20 shrink-0">
                AR
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-[#082f6b] truncate">
                    <span className="text-[#e52b32]">AR</span> Career Point
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-600" />
                  {t('Official')}
                  </span>
                </div>
                <p className="hidden sm:block text-xs font-medium text-slate-500 truncate">
                  {t('Your Success, Our Mission · Online Test & Study Portal')}
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className={`hidden md:flex min-w-0 items-center relative flex-1 max-w-md transition-all duration-200 ${
                searchFocused ? 'ring-2 ring-blue-500/30 shadow-md' : ''
              }`}
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={t('Search exams, subjects, or mock tests…')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-10 pr-24 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#0966df] hover:bg-[#0b55bb] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {t('Search')}
                </button>
              </div>
            </form>

            <div className="relative w-[112px] shrink-0">
              <Languages aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <select
                aria-label="Language"
                value={language}
                onChange={(event) => setLanguage(event.target.value === 'hi' ? 'hi' : 'en')}
                className="h-[38px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-7 text-[10px] sm:text-xs font-bold text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            {/* User Auth & Actions */}
            <div className="flex min-w-[84px] sm:min-w-[154px] items-center justify-end gap-1.5 sm:gap-2.5">
              {currentUser ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 py-1 sm:py-1.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 rounded-xl text-xs font-semibold text-[#082f6b] transition-all"
                    title={t('View Student Dashboard')}
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#082f6b] text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                      {currentUser.role}
                    </span>
                  </button>

                  <button
                    onClick={logoutUser}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title={t('Logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="inline-flex w-[74px] items-center justify-center gap-1 px-2 py-1.5 sm:py-2 text-xs font-bold text-[#082f6b] hover:text-blue-700 bg-slate-50 hover:bg-slate-100 rounded-lg sm:rounded-xl border border-slate-200 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t('Login')}</span>
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="hidden sm:inline-flex w-[78px] items-center justify-center gap-1.5 px-2 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff7a18] to-[#ea580c] hover:brightness-105 rounded-xl shadow-xs transition-all"
                  >
                    {t('Sign Up')}
                  </button>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-700 hover:text-[#082f6b] hover:bg-slate-100 rounded-xl transition-colors"
                aria-label={t('Menu')}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Desktop Navigation Bar */}
        <nav className="hidden md:block bg-[#082f6b] text-white border-t border-blue-900/60 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex shrink-0 items-center justify-center gap-2 ${item.width} px-2 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? 'bg-white/15 text-[#ffcf94] font-bold shadow-xs'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ffcf94]' : 'text-slate-300'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500 text-white font-extrabold uppercase tracking-wide">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu Modal / Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250 pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#082f6b] to-[#0966df] text-white flex items-center justify-center font-black text-sm">
                  AR
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">AR Career Point</h3>
                  <p className="text-[10px] text-slate-400">{t('Navigation & Categories')}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder={t('Search exams, subjects, or mock tests…')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 text-xs bg-slate-100 rounded-xl border border-slate-200 outline-none focus:bg-white focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#0966df] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                {t('Search')}
              </button>
            </form>

            {/* User Quick Bar in Mobile Sheet */}
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('login'); }}
                  className="py-2.5 text-xs font-bold text-[#082f6b] bg-blue-50 rounded-xl border border-blue-200 text-center"
                >
                  {t('Student Login')}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('signup'); }}
                  className="py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff7a18] to-[#ea580c] rounded-xl text-center shadow-xs"
                >
                  {t('Create Account')}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#082f6b] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-[10px] text-blue-600 font-semibold">{currentUser.targetExam}</div>
                  </div>
                </div>
                <button
                  onClick={() => { logoutUser(); setMobileMenuOpen(false); }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs flex items-center gap-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('Logout')}</span>
                </button>
              </div>
            )}

            {/* Nav Links Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 p-2.5 text-xs font-medium rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* App-Style Sticky Bottom Navigation Bar for Mobile (Hidden during Quiz) */}
      {activeTab !== 'quiz' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around pb-safe">
          <button
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px]">{t('Home')}</span>
          </button>

          <button
            onClick={() => handleNavClick('tests')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'tests' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px]">{t('Tests')}</span>
          </button>

          <button
            onClick={() => handleNavClick('practice')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'practice' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px]">{t('Practice')}</span>
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px]">{t('Dashboard')}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px]">{t('Menu')}</span>
          </button>
        </div>
      )}
    </>
  );
};

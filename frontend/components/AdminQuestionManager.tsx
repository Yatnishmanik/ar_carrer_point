'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExamCategory, Question } from '../types';
import { apiService, type AdminOverview, type ApiUser } from '../lib/api';
import { BulkQuestionUpload } from './BulkQuestionUpload';
import {
  PlusCircle,
  Trash2,
  Layers,
  Folder,
  FileText,
  CircleHelp,
  Users,
  Search,
  Pencil,
  X,
  ListChecks,
  LayoutDashboard,
  Upload,
} from 'lucide-react';

type AdminSection = 'overview' | 'users' | 'categories' | 'create-test' | 'add-question' | 'question-bank' | 'bulk-upload';

/* ─── helper: time-of-day greeting ─── */
const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
};

/* ─── role badge colour map ─── */
const roleBadge = (role: ApiUser['role']) => {
  switch (role) {
    case 'SUPERADMIN': return 'bg-purple-100 text-purple-700';
    case 'ADMIN':      return 'bg-rose-100 text-rose-700';
    default:           return 'bg-sky-100 text-sky-700';
  }
};
const roleLabel = (role: ApiUser['role'], t: (k: string) => string) => {
  switch (role) {
    case 'SUPERADMIN': return t('Superadmin');
    case 'ADMIN':      return t('Admin');
    default:           return t('Student');
  }
};

/* ─── avatar colour ring per initial ─── */
const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
];
const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

export const AdminQuestionManager: React.FC = () => {
  const {
    questions,
    currentUser,
    openAuthModal,
    addQuestionToBank,
    deleteQuestionFromBank,
    createExamCategory,
    createTest,
    showToast,
    exams,
    tests,
    refreshData,
    t,
  } = useApp();

  const [category, setCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryGroup, setNewCategoryGroup] = useState<ExamCategory['category']>('competitive');
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestSubtitle, setNewTestSubtitle] = useState('');
  const [newTestCategoryId, setNewTestCategoryId] = useState('');
  const [newTestDuration, setNewTestDuration] = useState(10);
  const [newTestPassingMarks, setNewTestPassingMarks] = useState(0);
  const [newTestTags, setNewTestTags] = useState<string[]>([]);
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
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STUDENT'>('STUDENT');
  const [userPhone, setUserPhone] = useState('');
  const [userTargetExam, setUserTargetExam] = useState('');
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  const loadOverview = useCallback(async () => {
    try { setOverview(await apiService.getAdminOverview()); }
    catch (error) { showToast(error instanceof Error ? error.message : t('Could not load users.'), 'error'); }
  }, [showToast, t]);
  useEffect(() => {
    let active = true;
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      apiService.getAdminOverview().then(data => { if (active) setOverview(data); })
        .catch(error => { if (active) showToast(error instanceof Error ? error.message : t('Could not load users.'), 'error'); });
    }
    return () => { active = false; };
  }, [currentUser?.role, showToast, t]);
  const startUserEdit = (user: ApiUser) => {
    setEditingUser(user); setUserName(user.name); setUserEmail(user.email); setUserPassword('');
    setUserRole(user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'); setUserPhone(user.phone || '');
    setUserTargetExam(user.targetExam || ''); setUserFormOpen(true);
  };
  const resetUserForm = () => {
    setEditingUser(null); setUserName(''); setUserEmail(''); setUserPassword(''); setUserPhone('');
    setUserTargetExam(''); setUserRole('STUDENT'); setUserFormOpen(false);
  };
  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault(); setUserSaving(true);
    try {
      const data = { name: userName.trim(), email: userEmail.trim(), role: userRole, phone: userPhone.trim() || undefined, targetExam: userTargetExam.trim() || undefined };
      if (editingUser) {
        await apiService.updateManagedUser(editingUser.id, { ...data, ...(userPassword ? { password: userPassword } : {}) });
        showToast(t('User updated.'), 'success');
      } else {
        await apiService.createManagedUser({ ...data, password: userPassword });
        showToast(t('User created.'), 'success');
      }
      resetUserForm(); await loadOverview();
    } catch (error) { showToast(error instanceof Error ? error.message : t('Could not save user.'), 'error'); }
    finally { setUserSaving(false); }
  };
  const handleDeleteUser = async (user: ApiUser) => {
    if (!window.confirm(`${t('Delete user')} ${user.name}?`)) return;
    try { await apiService.deleteManagedUser(user.id); showToast(t('User deleted.'), 'success'); await loadOverview(); }
    catch (error) { showToast(error instanceof Error ? error.message : t('Could not delete user.'), 'error'); }
  };
  const handleDeleteCategory = async (exam: ExamCategory) => {
    if (!window.confirm(`${t('Delete category')} "${exam.name}"?`)) return;
    try {
      await apiService.deleteExamCategory(exam.id);
      if (newTestCategoryId === exam.id) setNewTestCategoryId('');
      if (category === exam.id) setCategory('');
      showToast(t('Category deleted.'), 'success');
      await refreshData();
    } catch (error) { showToast(error instanceof Error ? error.message : t('Could not delete category.'), 'error'); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    const code = newCategoryCode.trim();
    if (!name || !code) { showToast(t('Enter a category name and code.'), 'error'); return; }
    if (await createExamCategory({ name, code, category: newCategoryGroup })) {
      setNewCategoryName('');
      setNewCategoryCode('');
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) { showToast(t('Enter a test title.'), 'error'); return; }
    if (!newTestCategoryId) { showToast(t('Create or select a category first.'), 'error'); return; }
    if (!Number.isInteger(newTestDuration) || newTestDuration < 1 || newTestPassingMarks < 0) {
      showToast(t('Enter a valid duration and passing mark.'), 'error'); return;
    }
    if (await createTest({
      title: newTestTitle.trim(),
      subtitle: newTestSubtitle.trim() || undefined,
      categoryId: newTestCategoryId,
      durationMinutes: newTestDuration,
      passingMarks: newTestPassingMarks,
      tags: newTestTags,
    })) {
      setNewTestTitle('');
      setNewTestSubtitle('');
      setNewTestPassingMarks(0);
      setNewTestTags([]);
    }
  };

  const toggleTestTag = (tag: string) => setNewTestTags(current =>
    current.includes(tag) ? current.filter(value => value !== tag) : [...current, tag]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      showToast(t('Enter a question.'), 'error');
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showToast(t('Fill all four answer options.'), 'error');
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

    if (!category) { showToast(t('Select a test first.'), 'error'); return; }
    if (!await addQuestionToBank(newQuestion, category)) return;

    // Reset form fields
    setQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) return <div className="p-12 text-center"><h1 className="text-xl font-bold">{t('Admin access required')}</h1><button className="underline mt-4" onClick={() => openAuthModal()}>{t('Sign in')}</button></div>;
  const isSuperAdmin = currentUser.role === 'superadmin';
  const canRemoveUser = (user: ApiUser) => user.id !== currentUser.id && user.role !== 'SUPERADMIN' && (isSuperAdmin || user.role === 'STUDENT');

  /* ── filtered user list for the table ── */
  const filteredUsers = (overview?.users || []).filter(user =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="mx-auto my-6 w-[calc(100%_-_32px)] max-w-[1200px] rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.04)] sm:p-6 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-x-6">
      <div className="col-span-full mb-6 flex flex-col items-stretch gap-6 border-b border-slate-200 pb-6 min-[901px]:flex-row min-[901px]:items-center min-[901px]:justify-between">
        {/* Greeting */}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{getGreeting()}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("Here's what's happening with your platform today.")}</p>
        </div>

        {/* Stat cards matching the screenshot colours */}
        <section className="grid w-full grid-cols-3 gap-2 sm:gap-3 min-[901px]:w-[540px] min-[901px]:shrink-0" aria-label={t('Platform overview')}>
          {[
            { label: t('Total Users'),     value: overview?.totalUsers ?? '—',                         icon: Users,      bg: 'bg-blue-50',   iconBg: 'bg-blue-600',   border: 'border-blue-100' },
            { label: t('Total Tests'),     value: overview?.totalTests ?? tests.length,                icon: FileText,   bg: 'bg-orange-50',  iconBg: 'bg-orange-500', border: 'border-orange-100' },
            { label: t('Total Questions'), value: overview?.totalQuestions ?? questions.length,         icon: CircleHelp,  bg: 'bg-red-50',     iconBg: 'bg-red-500',    border: 'border-red-100' },
          ].map(card => (
            <div key={card.label} className={`rounded-[14px] p-2.5 sm:px-4 sm:py-3.5 border ${card.border} ${card.bg}`}>
              <span className={`inline-flex p-[7px] rounded-full text-white ${card.iconBg}`}><card.icon className="w-[17px] h-[17px]" /></span>
              <p className="mt-2 text-[10px] sm:text-xs font-medium text-slate-600">{card.label}</p>
              <p className="text-2xl leading-[30px] font-black text-slate-950">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            </div>
          ))}
        </section>

      </div>

      {/* ━━━ Sidebar ━━━ */}
      <aside className="mb-4 lg:mb-0">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="px-3 py-3 mb-2 border-b border-slate-100">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">AR Career Point</p>
            <p className="font-extrabold text-slate-900">{isSuperAdmin ? t('Superadmin') : t('Admin Panel')}</p>
          </div>
          <nav aria-label={t('Admin sections')} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
            {[
              { id: 'overview' as const, label: t('Dashboard'), icon: LayoutDashboard },
              ...(isSuperAdmin ? [{ id: 'users' as const, label: t('Users'), icon: Users }] : []),
              { id: 'categories' as const, label: t('Category'), icon: Folder },
              { id: 'create-test' as const, label: t('Create a Test'), icon: FileText },
              { id: 'add-question' as const, label: t('Add Question'), icon: CircleHelp },
              { id: 'bulk-upload' as const, label: t('Bulk Upload Questions'), icon: Upload },
              { id: 'question-bank' as const, label: t('Current Question Bank'), icon: ListChecks },
            ].map(item => <button type="button" key={item.id} onClick={() => setActiveSection(item.id)} aria-current={activeSection === item.id ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${activeSection === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}><item.icon className="w-4 h-4 shrink-0" />{item.label}</button>)}
          </nav>
        </div>
      </aside>

      {/* ━━━ Main content ━━━ */}
      <main className="min-w-0 space-y-5">
      {activeSection === 'bulk-upload' && <BulkQuestionUpload />}

      {/* ── Overview / Dashboard ── */}
      {activeSection === 'overview' && <>
        {/* Quick user table preview (on overview, show first 5 users) */}
        {(
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">{t('Users')}</h2>
              <div className="flex items-center gap-3">
                <label className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder={t('Search users...')} className="w-40 sm:w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" />
                </label>
                <>{isSuperAdmin && <button onClick={() => setActiveSection('users')} className="text-sm font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap">{t('Manage All')} →</button>}</>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">{t('Name')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Email')}</th>
                    <th className="px-4 py-3 font-semibold">{t('Role')}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody>{filteredUsers.map((user, i) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2.5">
                        <span className={`grid h-8 w-8 place-items-center rounded-full font-bold text-sm ${avatarColor(user.name)}`}>{user.name.charAt(0).toUpperCase()}</span>
                        <span className="font-semibold text-slate-900">{user.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadge(user.role)}`}>{roleLabel(user.role, t)}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button disabled={!canRemoveUser(user)} onClick={() => void handleDeleteUser(user)} className="disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">{t('Remove')}</button>
                    </td>
                  </tr>
                ))}{!filteredUsers.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">{t('No users found.')}</td></tr>}</tbody>
              </table>
            </div>
          </section>
        )}
      </>}

      {/* ── Full Users Management (Superadmin only) ── */}
      {isSuperAdmin && activeSection === 'users' && <section id="users" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div><h2 className="text-xl font-black text-slate-900">{t('Users')}</h2><p className="text-sm text-slate-500">{t('Manage administrators and students.')}</p></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder={t('Search users...')} className="w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" /></label>
              <button onClick={() => { resetUserForm(); setUserFormOpen(true); }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">{t('Add User')}</button>
            </div>
          </div>
          {userFormOpen && <form onSubmit={handleSaveUser} className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-slate-900">{editingUser ? t('Edit User') : t('Create User')}</h3><button type="button" onClick={resetUserForm} aria-label={t('Close')}><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input required value={userName} onChange={event => setUserName(event.target.value)} placeholder={t('Name')} className="rounded-lg border border-slate-200 p-2.5 text-sm" />
              <input required type="email" value={userEmail} onChange={event => setUserEmail(event.target.value)} placeholder={t('Email')} className="rounded-lg border border-slate-200 p-2.5 text-sm" />
              <input required={!editingUser} minLength={8} type="password" value={userPassword} onChange={event => setUserPassword(event.target.value)} placeholder={editingUser ? t('New password (optional)') : t('Password (min 8 characters)')} className="rounded-lg border border-slate-200 p-2.5 text-sm" />
              <select value={userRole} onChange={event => setUserRole(event.target.value as 'ADMIN' | 'STUDENT')} className="rounded-lg border border-slate-200 p-2.5 text-sm"><option value="STUDENT">{t('Student')}</option><option value="ADMIN">{t('Admin')}</option></select>
              <input value={userPhone} onChange={event => setUserPhone(event.target.value)} placeholder={t('Phone (optional)')} className="rounded-lg border border-slate-200 p-2.5 text-sm" />
              <input value={userTargetExam} onChange={event => setUserTargetExam(event.target.value)} placeholder={t('Target exam (optional)')} className="rounded-lg border border-slate-200 p-2.5 text-sm" />
            </div>
            <div className="mt-3 flex gap-2"><button disabled={userSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{userSaving ? t('Saving...') : t('Save User')}</button><button type="button" onClick={resetUserForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{t('Cancel')}</button></div>
          </form>}

          {/* Full User table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">{t('Name')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Email')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Role')}</th>
                  <th className="px-4 py-3 font-semibold">{t('Joined')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2.5">
                        <span className={`grid h-8 w-8 place-items-center rounded-full font-bold text-sm ${avatarColor(user.name)}`}>{user.name.charAt(0).toUpperCase()}</span>
                        <span className="font-semibold text-slate-900">{user.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${roleBadge(user.role)}`}>{roleLabel(user.role, t)}</span></td>
                    <td className="px-4 py-3 text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button disabled={user.role === 'SUPERADMIN'} onClick={() => startUserEdit(user)} className="disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" />{t('Edit')}</button>
                        <button disabled={!canRemoveUser(user)} onClick={() => void handleDeleteUser(user)} className="disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" />{t('Remove')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">{t('No users found.')}</td></tr>}
              </tbody>
            </table>
          </div>
      </section>}

      {activeSection === 'categories' && <section id="categories" className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">{t('Test Categories')}</h2>
              <p className="text-xs text-slate-500">{t('Create categories for tests and question sets.')}</p>
            </div>
          </div>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-700">{t('Category name')}
                <input required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder={t('e.g. Bihar Board Class 10')} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </label>
              <label className="text-xs font-bold text-slate-700">{t('Short code')}
                <input required value={newCategoryCode} onChange={e => setNewCategoryCode(e.target.value)} placeholder={t('e.g. BSEB-10')} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </label>
            </div>
            <label className="block text-xs font-bold text-slate-700">{t('Category group')}
              <select value={newCategoryGroup} onChange={e => setNewCategoryGroup(e.target.value as ExamCategory['category'])} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                <option value="bihar-board">{t('Bihar Board')}</option>
                <option value="competitive">{t('Competitive Exams')}</option>
                <option value="all">{t('Other / All Exams')}</option>
              </select>
            </label>
            <button type="submit" className="w-full py-2.5 bg-[#0966df] hover:bg-[#0b55bb] text-white font-extrabold rounded-xl">{t('Add Category')}</button>
          </form>
          <div className="mt-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">{t('Available categories')} ({exams.length})</h3>
            {exams.length ? exams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{exam.name}</span>
                <span className="ml-auto shrink-0 text-slate-500">{exam.code} · {exam.category}</span>
                <button type="button" onClick={() => void handleDeleteCategory(exam)} title={t('Delete category')} aria-label={`${t('Delete category')} ${exam.name}`} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            )) : <p className="text-xs text-slate-500">{t('No categories yet. Add one above.')}</p>}
          </div>
      </section>}

      {activeSection === 'create-test' && <section id="test-management" className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">{t('Create a Test')}</h2>
              <p className="text-xs text-slate-500">{t('Choose its category and add tags.')}</p>
            </div>
          </div>
          <form onSubmit={handleCreateTest} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">{t('Test title')}
              <input required value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)} placeholder={t('e.g. BPSC Previous Year Paper 2025')} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
            </label>
            <label className="block text-xs font-bold text-slate-700">{t('Subtitle (optional)')}
              <input value={newTestSubtitle} onChange={e => setNewTestSubtitle(e.target.value)} placeholder={t('Short description')} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
            </label>
            <label className="block text-xs font-bold text-slate-700">{t('Test category')}
              <select required value={newTestCategoryId} onChange={e => setNewTestCategoryId(e.target.value)} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                <option value="">{t('Select a category')}</option>
                {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-700">{t('Duration (minutes)')}
                <input type="number" min={1} step={1} required value={newTestDuration} onChange={e => setNewTestDuration(Number(e.target.value))} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              </label>
              <label className="text-xs font-bold text-slate-700">{t('Passing marks')}
                <input type="number" min={0} step={0.5} value={newTestPassingMarks} onChange={e => setNewTestPassingMarks(Number(e.target.value))} className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              </label>
            </div>
            <fieldset>
              <legend className="text-xs font-bold text-slate-700 mb-2">{t('Tags')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {['Competitive Exam', 'Previous Year', 'Practice Set', 'Bihar Board', 'Mock Test', 'Model Paper'].map(tag => (
                  <label key={tag} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <input type="checkbox" checked={newTestTags.includes(tag)} onChange={() => toggleTestTag(tag)} />{t(tag)}
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" disabled={!exams.length} className="w-full py-2.5 bg-[#0966df] hover:bg-[#0b55bb] disabled:bg-slate-300 text-white font-extrabold rounded-xl">{t('Create Test')}</button>
          </form>
      </section>}

      {activeSection === 'add-question' && <div id="question-management" className="grid grid-cols-1 gap-5 items-stretch">
        
        {/* Form: Add Question */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {t('Add Question')}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                {t('Test category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-base sm:text-sm"
                >
                  <option value="">{t('Select a test')}</option>
                  {tests.map(test => <option key={test.id} value={test.id}>{test.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('Subject')}
                </label>
                <input
                  type="text"
                  placeholder={t('Physics, Hindi, History')}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {t('Question text')} *
              </label>
              <textarea
                required
                rows={3}
                placeholder={t('Enter the question text')}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Option A')} *</label>
                <input
                  required
                  type="text"
                  placeholder={t('Option A')}
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Option B')} *</label>
                <input
                  required
                  type="text"
                  placeholder={t('Option B')}
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Option C')} *</label>
                <input
                  required
                  type="text"
                  placeholder={t('Option C')}
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Option D')} *</label>
                <input
                  required
                  type="text"
                  placeholder={t('Option D')}
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
                  {t('Correct option')}
                </label>
                <select
                  value={correctOptionIndex}
                  onChange={(e) => setCorrectOptionIndex(Number(e.target.value))}
                  className="w-full p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold outline-none"
                >
                  <option value={0}>{t('Option A')}</option>
                  <option value={1}>{t('Option B')}</option>
                  <option value={2}>{t('Option C')}</option>
                  <option value={3}>{t('Option D')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Marks')}</label>
                <input
                  type="number"
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('Negative marks')}</label>
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
                {t('Explanation / solution')}
              </label>
              <textarea
                rows={2}
                placeholder={t('Write the answer explanation')}
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
              <span>{t('Save Question')}</span>
            </button>
          </form>
        </div>

        {/* Current Questions List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {t('Current Question Bank')}
              </h2>
              <p className="text-xs text-slate-500">{questions.length} {t('questions available')}</p>
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
                    title={t('Remove Question')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-emerald-700 font-bold">
                    {t('Correct answer:')} {['A', 'B', 'C', 'D'][q.correctOptionIndex]} ({q.options[q.correctOptionIndex]?.text})
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

      </div>}

      {activeSection === 'question-bank' && <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">{t('Current Question Bank')}</h2>
              <p className="text-xs text-slate-500">{questions.length} {t('questions available')}</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><Layers className="w-4 h-4" /></span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            {questions.map((q, idx) => <div key={q.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all text-xs space-y-2">
              <div className="flex items-start justify-between gap-2"><div className="font-bold text-slate-800 line-clamp-2"><span className="text-blue-600 mr-1.5">#{idx + 1}</span>{q.questionText}</div><button onClick={() => deleteQuestionFromBank(q.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" title={t('Remove Question')}><Trash2 className="w-3.5 h-3.5" /></button></div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]"><span className="text-emerald-700 font-bold">{t('Correct answer:')} {['A', 'B', 'C', 'D'][q.correctOptionIndex]} ({q.options[q.correctOptionIndex]?.text})</span>{q.subject && <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{q.subject}</span>}</div>
            </div>)}
            {!questions.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{t('No questions available.')}</p>}
          </div>
        </section>}

      </main>
    </div>
  );
};

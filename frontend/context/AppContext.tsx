'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ExamCategory, NoticeUpdate, PracticeSet, Question, Test, TestAttemptResult, UserProfile } from '../types';
import { apiService, getToken, setToken, type ApiQuestion, type ApiTest, type ApiStoredAttempt, type ApiUser, type BulkImportResult } from '../lib/api';
import type { BulkQuestionInput } from '../lib/question-import';
import { translate, type Language } from '../lib/i18n';

interface AppContextType {
  language: Language; setLanguage: (language: Language) => void; t: (key: string, values?: Record<string, string | number>) => string;
  activeTab: string; setActiveTab: (tab: string) => void;
  testFilter: string; setTestFilter: (filter: string) => void;
  searchQuery: string; setSearchQuery: (query: string) => void;
  exams: ExamCategory[]; practiceSets: PracticeSet[]; tests: Test[]; questions: Question[]; updates: NoticeUpdate[];
  activeTest: Test | null; currentResult: TestAttemptResult | null; attemptsHistory: TestAttemptResult[];
  currentUser: UserProfile | null; isAuthModalOpen: boolean; authModalTab: 'login' | 'signup';
  toast: { show: boolean; message: string; type: 'success' | 'info' | 'error' | 'warning' };
  loading: boolean; error: string | null;
  startTestById: (id?: string) => Promise<void>;
  submitTestAnswers: (answers: Record<number, number>, marked: number[], seconds: number, questionTimes?: Record<number, number>) => Promise<void>;
  reviewAttempt: (id: string) => Promise<void>;
  addQuestionToBank: (q: Question, testId?: string) => Promise<boolean>;
  importQuestionsToTest: (testId: string, questions: BulkQuestionInput[]) => Promise<BulkImportResult>;
  deleteQuestionFromBank: (id: string) => Promise<void>;
  createExamCategory: (data: { name: string; code: string; category: ExamCategory['category'] }) => Promise<boolean>;
  createTest: (data: { title: string; subtitle?: string; categoryId: string; durationMinutes: number; passingMarks: number; tags: string[] }) => Promise<boolean>;
  openAuthModal: (mode?: 'login' | 'signup') => void; closeAuthModal: () => void;
  loginUser: (identifier: string, password: string, username?: string) => Promise<void>;
  logoutUser: () => void; showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  hideToast: () => void; retakeCurrentTest: () => void; refreshData: () => Promise<void>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'ar_career_point_language';
const LANGUAGE_CHANGE_EVENT = 'ar-career-point-language-change';
const subscribeLanguage = (callback: () => void) => {
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};
const getLanguageSnapshot = (): Language => window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'hi' ? 'hi' : 'en';
const getServerLanguageSnapshot = (): Language => 'en';
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.';
const toQuestion = (q: ApiQuestion): Question => ({ ...q, correctOptionIndex: q.options.findIndex(o => o.isCorrect) });
const toTest = (t: ApiTest): Test => ({ ...t, subtitle: t.subtitle || '', category: t.categoryName,
  questions: (t.questions || []).map(toQuestion) });
const toUser = (u: ApiUser): UserProfile => ({ ...u, role: u.role === 'SUPERADMIN' ? 'superadmin' : u.role === 'ADMIN' ? 'admin' : 'student' });
const toAttempt = (a: ApiStoredAttempt): TestAttemptResult => {
  const rows = a.userAnswers || [];
  const questions = rows.map(r => toQuestion(r.question));
  const answers: Record<number, number> = {};
  rows.forEach((r, i) => { const index = r.question.options.findIndex(o => o.id === r.selectedOptionId); if (index >= 0) answers[i] = index; });
  return { id: a.id, testId: a.testId, testTitle: a.test.title, timestamp: a.createdAt,
    durationMinutes: a.test.durationMinutes, passingMarks: a.test.passingMarks,
    questionTimes: Object.fromEntries(rows.filter(r => r.timeSpentSeconds != null).map(r => [r.question.id, r.timeSpentSeconds!])),
    questionMarks: Object.fromEntries(rows.map(r => [r.question.id, r.marksAwarded])),
    totalQuestions: a.correctCount + a.incorrectCount + a.unansweredCount, attempted: a.correctCount + a.incorrectCount,
    correct: a.correctCount, wrong: a.incorrectCount, unanswered: a.unansweredCount,
    score: a.score, maxScore: a.maxScore, percentage: a.percentage, timeSpentSeconds: a.timeSpentSeconds,
    answers, markedQuestions: [], questions };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = pathname === '/' ? 'home' : pathname.split('/')[1];
  const setActiveTab = useCallback((tab: string) => {
    if (['home', 'tests', 'practice', 'quiz', 'result', 'dashboard', 'admin'].includes(tab)) router.push(tab === 'home' ? '/' : `/${tab}`);
  }, [router]);
  const [searchQuery, setSearchQuery] = useState('');
  const [testFilter, setTestFilter] = useState('all');
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, getServerLanguageSnapshot);
  const [exams, setExams] = useState<ExamCategory[]>([]);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [updates, setUpdates] = useState<NoticeUpdate[]>([]);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentResult, setCurrentResult] = useState<TestAttemptResult | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<TestAttemptResult[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [toast, setToast] = useState<AppContextType['toast']>({ show: false, message: '', type: 'info' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authVersion = useRef(0);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);
  const t = useCallback((key: string, values?: Record<string, string | number>) => translate(language, key, values), [language]);
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ show: true, message, type });
    toastTimeout.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);
  }, []);
  const refreshData = useCallback(() =>
    Promise.all([apiService.getExams(), apiService.getPracticeSets(), apiService.getTests(), apiService.getUpdates()])
      .then(([exams, practices, tests, updates]) => {
        setExams(exams); setPracticeSets(practices); setTests(tests.map(toTest)); setUpdates(updates); setError(null);
      }).catch(e => { setError(messageOf(e)); }).finally(() => setLoading(false)), []);
  useEffect(() => {
    void refreshData();
    if (getToken()) {
      const version = authVersion.current;
      apiService.getMe().then(u => { if (version === authVersion.current) setCurrentUser(toUser(u)); })
        .catch(() => { if (version === authVersion.current) { setToken(null); setCurrentUser(null); } });
    }
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, [refreshData]);
  useEffect(() => {
    let cancelled = false;
    if (currentUser) {
      apiService.getUserAttempts(currentUser.id).then(rows => { if (!cancelled) setAttemptsHistory(rows.map(toAttempt)); }).catch(e => showToast(messageOf(e), 'error'));
      if (['admin', 'superadmin'].includes(currentUser.role)) apiService.getQuestions().then(rows => { if (!cancelled) setQuestions(rows.map(toQuestion)); }).catch(e => showToast(messageOf(e), 'error'));
    }
    return () => { cancelled = true; };
  }, [currentUser, showToast]);
  const openAuthModal = (mode: 'login' | 'signup' = 'login') => { setAuthModalTab(mode); setIsAuthModalOpen(true); };
  const loginUser = async (identifier: string, password: string, username?: string) => {
    const version = ++authVersion.current;
    const result = username === undefined ? await apiService.login({ identifier, password }) : await apiService.register({ email: identifier, password, username });
    if (version !== authVersion.current) return;
    setToken(result.token); setAttemptsHistory([]); setQuestions([]); setActiveTest(null); setCurrentResult(null);
    setCurrentUser(toUser(result.user)); setIsAuthModalOpen(false); showToast(`Welcome, ${result.user.name}`, 'success');
  };
  const logoutUser = () => {
    authVersion.current++; setToken(null); setCurrentUser(null); setAttemptsHistory([]); setQuestions([]); setActiveTest(null); setCurrentResult(null); setActiveTab('home');
  };
  const startTestById = async (id?: string) => {
    if (!currentUser) { openAuthModal(); return; }
    const testId = id || tests[0]?.id;
    if (!testId) { showToast('No published test is available yet.', 'info'); return; }
    try {
      const test = toTest(await apiService.getTestById(testId));
      if (!test.questions.length) throw new Error('This test has no questions yet.');
      setActiveTest({ ...test, startedAt: Date.now() }); setCurrentResult(null); setActiveTab('quiz');
    } catch (e) { showToast(messageOf(e), 'error'); }
  };
  const submitTestAnswers = async (answers: Record<number, number>, marked: number[], seconds: number, questionTimes?: Record<number, number>) => {
    if (!activeTest || !currentUser) throw new Error('Please sign in and select a test.');
    const result = await apiService.submitAttempt({ testId: activeTest.id, timeSpentSeconds: seconds,
      ...(questionTimes ? { questionTimes: activeTest.questions.map((q, i) => ({ questionId: q.id, timeSpentSeconds: questionTimes[i] ?? 0 })) } : {}),
      answers: Object.entries(answers).map(([index, option]) => ({ questionId: activeTest.questions[Number(index)].id, selectedOptionId: activeTest.questions[Number(index)].options[option].id })) });
    const reviewAnswers: Record<number, number> = {};
    const reviewQuestions = result.questionReview.map((q, i) => {
      const selected = q.options.findIndex(o => o.id === q.userSelectedOptionId);
      if (selected >= 0) reviewAnswers[i] = selected;
      return { ...q, id: q.questionId, correctOptionIndex: q.options.findIndex(o => o.id === q.correctOptionId) };
    });
    const attempt: TestAttemptResult = { id: result.attemptId, testId: result.testId, testTitle: result.testTitle,
      durationMinutes: result.durationMinutes, passingMarks: result.passingMarks,
      questionTimes: Object.fromEntries(result.questionReview.filter(q => q.timeSpentSeconds != null).map(q => [q.questionId, q.timeSpentSeconds!])),
      questionMarks: Object.fromEntries(result.questionReview.map(q => [q.questionId, q.marksAwarded])),
      timestamp: result.timestamp, totalQuestions: result.totalQuestions, attempted: result.correctCount + result.incorrectCount,
      correct: result.correctCount, wrong: result.incorrectCount, unanswered: result.unansweredCount, score: result.score,
      maxScore: result.maxScore, percentage: result.percentage, timeSpentSeconds: result.timeSpentSeconds,
      answers: reviewAnswers, markedQuestions: marked, questions: reviewQuestions };
    setCurrentResult(attempt); setAttemptsHistory(prev => [attempt, ...prev.filter(a => a.id !== attempt.id)]);
    setActiveTab('result'); showToast('Test submitted successfully.', 'success');
  };
  const reviewAttempt = async (id: string) => {
    try { setCurrentResult(toAttempt(await apiService.getAttemptById(id))); setActiveTab('result'); }
    catch (e) { showToast(messageOf(e), 'error'); }
  };
  const addQuestionToBank = async (q: Question, testId?: string) => {
    try {
      await apiService.createQuestion({ ...q, id: undefined, testId, options: q.options.map((o, i) => ({ text: o.text, isCorrect: i === q.correctOptionIndex })) });
      setQuestions((await apiService.getQuestions()).map(toQuestion)); await refreshData(); showToast('Question saved.', 'success'); return true;
    } catch (e) { showToast(messageOf(e), 'error'); return false; }
  };
  const importQuestionsToTest = async (testId: string, questions: BulkQuestionInput[]) => {
    const result = await apiService.bulkImportQuestions(testId, questions);
    const rows = await apiService.getQuestions().catch(() => null);
    if (rows) setQuestions(rows.map(toQuestion));
    await refreshData();
    showToast(t('Imported {count} questions.', { count: result.importedCount }), 'success');
    return result;
  };
  const deleteQuestionFromBank = async (id: string) => {
    try { await apiService.deleteQuestion(id); setQuestions(prev => prev.filter(q => q.id !== id)); await refreshData(); showToast('Question deleted.', 'success'); }
    catch (e) { showToast(messageOf(e), 'error'); }
  };
  const createExamCategory = async (data: { name: string; code: string; category: ExamCategory['category'] }) => {
    try { await apiService.createExamCategory(data); await refreshData(); showToast('Category created.', 'success'); return true; }
    catch (e) { showToast(messageOf(e), 'error'); return false; }
  };
  const createTest = async (data: { title: string; subtitle?: string; categoryId: string; durationMinutes: number; passingMarks: number; tags: string[] }) => {
    try { await apiService.createTest(data); await refreshData(); showToast('Test created.', 'success'); return true; }
    catch (e) { showToast(messageOf(e), 'error'); return false; }
  };
  return <AppContext.Provider value={{ language, setLanguage, t, activeTab, setActiveTab, searchQuery, setSearchQuery, testFilter, setTestFilter, exams, practiceSets, tests, questions, updates,
    activeTest, currentResult, attemptsHistory, currentUser, isAuthModalOpen, authModalTab, toast, loading, error,
    startTestById, submitTestAnswers, reviewAttempt, addQuestionToBank, importQuestionsToTest, deleteQuestionFromBank, createExamCategory, createTest, openAuthModal,
    closeAuthModal: () => setIsAuthModalOpen(false), loginUser, logoutUser, showToast,
    hideToast: () => setToast(t => ({ ...t, show: false })), retakeCurrentTest: () => { void startTestById(activeTest?.id || currentResult?.testId); }, refreshData,
  }}>{children}</AppContext.Provider>;
}
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

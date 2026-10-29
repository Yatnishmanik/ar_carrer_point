'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ExamCategory, NoticeUpdate, PracticeSet, Question, Test, TestAttemptResult, UserProfile } from '../types';
import { apiService, getToken, setToken, ApiError, type ApiQuestion, type ApiTest, type ApiStoredAttempt, type ApiUser } from '../lib/api';

interface AppContextType {
  activeTab: string; setActiveTab: (tab: string) => void;
  searchQuery: string; setSearchQuery: (query: string) => void;
  exams: ExamCategory[]; practiceSets: PracticeSet[]; tests: Test[]; questions: Question[]; updates: NoticeUpdate[];
  activeTest: Test | null; currentResult: TestAttemptResult | null; attemptsHistory: TestAttemptResult[];
  currentUser: UserProfile | null; isAuthModalOpen: boolean; authModalTab: 'login' | 'signup';
  toast: { show: boolean; message: string; type: 'success' | 'info' | 'error' };
  authLoading: boolean; authAudience: 'student' | 'admin';
  adminTests: Test[]; refreshAdminData: () => Promise<void>;
  loading: boolean; error: string | null;
  startTestById: (id?: string) => Promise<void>;
  submitTestAnswers: (answers: Record<number, number>, marked: number[], seconds: number) => Promise<void>;
  reviewAttempt: (id: string) => Promise<void>;
  addQuestionToBank: (q: Question, testId?: string) => Promise<boolean>;
  deleteQuestionFromBank: (id: string) => Promise<void>;
  openAuthModal: (mode?: 'login' | 'signup', audience?: 'student' | 'admin') => void; closeAuthModal: () => void;
  loginUser: (email: string, password: string, name?: string, targetExam?: string, audience?: 'student' | 'admin') => Promise<void>;
  logoutUser: () => void; showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void; retakeCurrentTest: () => void; refreshData: () => Promise<void>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.';
const toQuestion = (q: ApiQuestion): Question => ({ ...q, correctOptionIndex: q.options.findIndex(o => o.isCorrect) });
const toTest = (t: ApiTest): Test => ({ ...t, subtitle: t.subtitle || '', category: t.categoryName,
  questions: (t.questions || []).map(toQuestion) });
const toUser = (u: ApiUser): UserProfile => ({ ...u, role: u.role === 'ADMIN' ? 'admin' : 'student' });
const toAttempt = (a: ApiStoredAttempt): TestAttemptResult => {
  const rows = a.userAnswers || [];
  const questions = rows.map(r => toQuestion(r.question));
  const answers: Record<number, number> = {};
  rows.forEach((r, i) => { const index = r.question.options.findIndex(o => o.id === r.selectedOptionId); if (index >= 0) answers[i] = index; });
  return { id: a.id, testId: a.testId, testTitle: a.test.title, timestamp: a.createdAt,
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
  const [authLoading, setAuthLoading] = useState(true);
  const [authAudience, setAuthAudience] = useState<'student' | 'admin'>('student');
  const [adminTests, setAdminTests] = useState<Test[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ show: true, message, type });
    toastTimeout.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 5000);
  }, []);
  const refreshData = useCallback(() =>
    Promise.all([apiService.getExams(), apiService.getPracticeSets(), apiService.getTests(), apiService.getUpdates()])
      .then(([exams, practices, tests, updates]) => {
        setExams(exams); setPracticeSets(practices); setTests(tests.map(toTest)); setUpdates(updates); setError(null);
      }).catch(e => { setError(messageOf(e)); }).finally(() => setLoading(false)), []);
  const refreshAdminData = useCallback(async () => {
    const version = authVersion.current;
    const [rows, tests] = await Promise.all([apiService.getQuestions(), apiService.getAdminTests()]);
    if (version === authVersion.current) { setQuestions(rows.map(toQuestion)); setAdminTests(tests.map(toTest)); }
  }, []);
  useEffect(() => {
    void refreshData();
    if (getToken()) {
      const version = authVersion.current;
      apiService.getMe().then(u => { if (version === authVersion.current) setCurrentUser(toUser(u)); })
        .catch(e => { if (version === authVersion.current) {
          if (e instanceof ApiError && e.status === 401) { setToken(null); setCurrentUser(null); }
          else showToast('Could not verify your session. Please retry when the API is available.', 'error');
        } }).finally(() => setAuthLoading(false));
    } else {
      Promise.resolve().then(() => setAuthLoading(false));
    }
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, [refreshData, showToast]);
  useEffect(() => {
    let cancelled = false;
    if (currentUser) {
      apiService.getUserAttempts(currentUser.id).then(rows => { if (!cancelled) setAttemptsHistory(rows.map(toAttempt)); }).catch(e => showToast(messageOf(e), 'error'));
      if (currentUser.role === 'admin') void refreshAdminData().catch(e => { if (!cancelled) showToast(messageOf(e), 'error'); });
    }
    return () => { cancelled = true; };
  }, [currentUser, showToast, refreshAdminData]);
  useEffect(() => {
    const revalidate = () => {
      if (!getToken()) return;
      const version = authVersion.current;
      apiService.getMe().then(u => {
        if (version !== authVersion.current) return;
        setCurrentUser(toUser(u));
        if (u.role !== 'ADMIN') { setQuestions([]); setAdminTests([]); }
      }).catch(e => {
        if (version === authVersion.current && e instanceof ApiError && e.status === 401) {
          authVersion.current++; setToken(null); setCurrentUser(null); setQuestions([]); setAdminTests([]); setAttemptsHistory([]); setActiveTest(null); setCurrentResult(null);
        }
      });
    };
    const onAuthStatus = (event: Event) => {
      // Avoid a loop when /auth/me itself rejects an expired token.
      if ((event as CustomEvent<number>).detail === 401) {
        authVersion.current++; setToken(null); setCurrentUser(null); setQuestions([]); setAdminTests([]); setAttemptsHistory([]); setActiveTest(null); setCurrentResult(null);
      } else revalidate();
    };
    window.addEventListener('focus', revalidate);
    window.addEventListener('ar-auth-status', onAuthStatus);
    return () => { window.removeEventListener('focus', revalidate); window.removeEventListener('ar-auth-status', onAuthStatus); };
  }, []);
  const openAuthModal = (mode: 'login' | 'signup' = 'login', audience: 'student' | 'admin' = 'student') => {
    setAuthAudience(audience); setAuthModalTab(audience === 'admin' ? 'login' : mode); setIsAuthModalOpen(true);
  };
  const loginUser = async (email: string, password: string, name?: string, targetExam?: string, audience: 'student' | 'admin' = 'student') => {
    const version = ++authVersion.current;
    const result = audience === 'admin' ? await apiService.adminLogin({ email, password }) : name === undefined ? await apiService.login({ email, password }) : await apiService.register({ email, password, name, targetExam });
    if (version !== authVersion.current) return;
    setToken(result.token); setAttemptsHistory([]); setQuestions([]); setAdminTests([]); setActiveTest(null); setCurrentResult(null);
    setCurrentUser(toUser(result.user)); setAuthLoading(false); setIsAuthModalOpen(false); setActiveTab(result.user.role === 'ADMIN' ? 'admin' : 'dashboard'); showToast(`Welcome, ${result.user.name}`, 'success');
  };
  const logoutUser = () => {
    authVersion.current++; setToken(null); setCurrentUser(null); setAttemptsHistory([]); setQuestions([]); setAdminTests([]); setActiveTest(null); setCurrentResult(null); setActiveTab('home');
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
  const submitTestAnswers = async (answers: Record<number, number>, marked: number[], seconds: number) => {
    if (!activeTest || !currentUser) throw new Error('Please sign in and select a test.');
    const result = await apiService.submitAttempt({ testId: activeTest.id, timeSpentSeconds: seconds,
      answers: Object.entries(answers).map(([index, option]) => ({ questionId: activeTest.questions[Number(index)].id, selectedOptionId: activeTest.questions[Number(index)].options[option].id })) });
    const reviewAnswers: Record<number, number> = {};
    const reviewQuestions = result.questionReview.map((q, i) => {
      const selected = q.options.findIndex(o => o.id === q.userSelectedOptionId);
      if (selected >= 0) reviewAnswers[i] = selected;
      return { ...q, id: q.questionId, correctOptionIndex: q.options.findIndex(o => o.id === q.correctOptionId) };
    });
    const attempt: TestAttemptResult = { id: result.attemptId, testId: result.testId, testTitle: result.testTitle,
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
      await refreshAdminData(); await refreshData(); showToast('Question saved.', 'success'); return true;
    } catch (e) { showToast(messageOf(e), 'error'); return false; }
  };
  const deleteQuestionFromBank = async (id: string) => {
    try { await apiService.deleteQuestion(id); setQuestions(prev => prev.filter(q => q.id !== id)); await refreshAdminData(); await refreshData(); showToast('Question deleted.', 'success'); }
    catch (e) { showToast(messageOf(e), 'error'); }
  };
  return <AppContext.Provider value={{ activeTab, setActiveTab, searchQuery, setSearchQuery, exams, practiceSets, tests, questions, updates,
    activeTest, currentResult, attemptsHistory, currentUser, isAuthModalOpen, authModalTab, toast, loading, error, authLoading, authAudience, adminTests, refreshAdminData,
    startTestById, submitTestAnswers, reviewAttempt, addQuestionToBank, deleteQuestionFromBank, openAuthModal,
    closeAuthModal: () => setIsAuthModalOpen(false), loginUser, logoutUser, showToast,
    hideToast: () => setToast(t => ({ ...t, show: false })), retakeCurrentTest: () => { void startTestById(activeTest?.id || currentResult?.testId); }, refreshData,
  }}>{children}</AppContext.Provider>;
}
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

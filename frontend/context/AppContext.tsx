'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ExamCategory,
  NoticeUpdate,
  PracticeSet,
  Question,
  Test,
  TestAttemptResult,
  UserProfile,
} from '../types';
import {
  defaultQuestions,
  initialExams,
  initialPracticeSets,
  initialTests,
  initialUpdates,
} from '../data/mockData';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  exams: ExamCategory[];
  practiceSets: PracticeSet[];
  tests: Test[];
  questions: Question[];
  updates: NoticeUpdate[];
  activeTest: Test | null;
  currentResult: TestAttemptResult | null;
  attemptsHistory: TestAttemptResult[];
  currentUser: UserProfile | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  toast: ToastState;
  
  // Actions
  startTestById: (testId?: string) => void;
  startCustomTestWithQuestions: (title: string, questionsList: Question[]) => void;
  finishTestAttempt: (attempt: TestAttemptResult) => void;
  addQuestionToBank: (newQ: Question, categoryTestTitle?: string) => void;
  deleteQuestionFromBank: (questionId: string) => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  loginUser: (email: string, role?: 'student' | 'admin', name?: string) => void;
  logoutUser: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
  retakeCurrentTest: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ATTEMPTS = 'ar_career_point_attempts_v1';
const LOCAL_STORAGE_KEY_QUESTIONS = 'ar_career_point_questions_v1';
const LOCAL_STORAGE_KEY_USER = 'ar_career_point_user_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exams] = useState<ExamCategory[]>(initialExams);
  const [practiceSets] = useState<PracticeSet[]>(initialPracticeSets);
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [updates] = useState<NoticeUpdate[]>(initialUpdates);

  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentResult, setCurrentResult] = useState<TestAttemptResult | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<TestAttemptResult[]>([]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: 'user-demo-1',
    name: 'अमित कुमार (Demo Student)',
    email: 'amit.demo@example.com',
    role: 'student',
    targetExam: 'Bihar Board Class 10th',
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  // Load persisted history & questions on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY_ATTEMPTS);
      if (savedHistory) {
        setAttemptsHistory(JSON.parse(savedHistory));
      }
      const savedQuestions = localStorage.getItem(LOCAL_STORAGE_KEY_QUESTIONS);
      if (savedQuestions) {
        const loadedQ = JSON.parse(savedQuestions);
        if (Array.isArray(loadedQ) && loadedQ.length > 0) {
          setQuestions(loadedQ);
        }
      }
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const startTestById = (testId?: string) => {
    const found = tests.find(t => t.id === testId) || tests[0];
    // Attach fresh questions if test uses default set
    const effectiveTest: Test = {
      ...found,
      questions: found.questions && found.questions.length > 0 ? found.questions : questions,
    };
    setActiveTest(effectiveTest);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`"${effectiveTest.title}" शुरू हो गया है। All the best!`, 'info');
  };

  const startCustomTestWithQuestions = (title: string, questionsList: Question[]) => {
    const customTest: Test = {
      id: `custom-${Date.now()}`,
      title,
      subtitle: 'Online Practice Mock Test',
      category: 'General Practice',
      durationMinutes: Math.max(5, Math.ceil(questionsList.length * 1.2)),
      totalMarks: questionsList.length,
      passingMarks: Math.ceil(questionsList.length * 0.4),
      questions: questionsList,
    };
    setActiveTest(customTest);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retakeCurrentTest = () => {
    if (activeTest) {
      setActiveTab('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      startTestById();
    }
  };

  const finishTestAttempt = (attempt: TestAttemptResult) => {
    setCurrentResult(attempt);
    setAttemptsHistory(prev => {
      const next = [attempt, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ATTEMPTS, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setActiveTab('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('आपका टेस्ट सफलतापूर्वक सबमिट हो गया है!', 'success');
  };

  const addQuestionToBank = (newQ: Question, categoryTestTitle?: string) => {
    setQuestions(prev => {
      const updated = [...prev, newQ];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_QUESTIONS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Also update tests if applicable
    setTests(prev =>
      prev.map(t => {
        if (!categoryTestTitle || t.title.toLowerCase().includes(categoryTestTitle.toLowerCase()) || t.category.toLowerCase().includes(categoryTestTitle.toLowerCase())) {
          return {
            ...t,
            questions: [...t.questions, newQ],
            totalMarks: t.totalMarks + (newQ.marks || 1),
          };
        }
        return t;
      })
    );

    showToast('नया प्रश्न सफलता से टेस्ट बैंक में जोड़ा गया!', 'success');
  };

  const deleteQuestionFromBank = (questionId: string) => {
    if (questions.length <= 1) {
      showToast('कम से कम एक प्रश्न टेस्ट में रहना आवश्यक है।', 'error');
      return;
    }
    setQuestions(prev => {
      const updated = prev.filter(q => q.id !== questionId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_QUESTIONS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setTests(prev =>
      prev.map(t => ({
        ...t,
        questions: t.questions.filter(q => q.id !== questionId),
      }))
    );

    showToast('प्रश्न हटा दिया गया।', 'info');
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalTab(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginUser = (email: string, role: 'student' | 'admin' = 'student', name?: string) => {
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      name: name || (role === 'admin' ? 'Admin Officer' : email.split('@')[0]),
      role,
      targetExam: role === 'admin' ? 'All Exam Controller' : 'Bihar Board Class 10th',
    };
    setCurrentUser(user);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
    showToast(`स्वागत है, ${user.name}! (${role === 'admin' ? 'Admin' : 'Student'})`, 'success');
  };

  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    } catch {
      // ignore
    }
    showToast('आप सफलतापूर्वक लॉग आउट हो गए हैं।', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        exams,
        practiceSets,
        tests,
        questions,
        updates,
        activeTest,
        currentResult,
        attemptsHistory,
        currentUser,
        isAuthModalOpen,
        authModalTab,
        toast,
        startTestById,
        startCustomTestWithQuestions,
        finishTestAttempt,
        addQuestionToBank,
        deleteQuestionFromBank,
        openAuthModal,
        closeAuthModal,
        loginUser,
        logoutUser,
        showToast,
        hideToast,
        retakeCurrentTest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

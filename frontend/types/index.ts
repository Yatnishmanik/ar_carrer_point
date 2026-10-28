export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  testId?: string;
  questionText: string;
  options: Option[];
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation?: string;
  subject?: string;
  marks?: number;
  negativeMarks?: number;
}

export interface ExamCategory {
  id: string;
  name: string;
  code: string;
  icon: string;
  colorClass: string;
  accentColor: string;
  gradient: string;
  items: string[];
  testCount: number;
  category: 'bihar-board' | 'competitive' | 'all';
}

export interface PracticeSet {
  testId?: string;
  id: string;
  title: string;
  subject: string;
  category: string;
  questionsCount: number;
  durationMinutes: number;
  pdfUrl?: string;
  isFree: boolean;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface Test {
  startedAt?: number;
  categoryId?: string;
  questionCount?: number;
  id: string;
  title: string;
  subtitle: string;
  category: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string[];
  questions: Question[];
}

export interface TestAttemptResult {
  id: string;
  testId: string;
  testTitle: string;
  timestamp: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  answers: Record<number, number>; // questionIndex -> optionIndex
  markedQuestions: number[];
  questions: Question[];
}

export interface NoticeUpdate {
  id: string;
  title: string;
  date: string;
  badge?: string;
  link?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  targetExam?: string;
  role: 'student' | 'admin';
}

import type { ExamCategory, NoticeUpdate, PracticeSet, Question } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'ar_career_point_token';
export const getToken = () => typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token: string | null) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
};

export async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body.data as T;
}

export type ApiQuestion = Omit<Question, 'correctOptionIndex'>;
export interface ApiTest {
  id: string; title: string; subtitle?: string; categoryName: string; categoryId?: string;
  durationMinutes: number; totalMarks: number; passingMarks: number; instructions?: string[];
  questionCount?: number; questions?: ApiQuestion[];
}
export interface ApiUser { id: string; name: string; email: string; role: 'ADMIN' | 'STUDENT'; targetExam?: string }
export interface ApiReview {
  questionId: string; questionText: string; options: Question['options']; correctOptionId?: string;
  userSelectedOptionId?: string; explanation?: string; subject?: string; marks: number; negativeMarks: number;
}
export interface ApiResult {
  attemptId: string; testId: string; testTitle: string; timestamp: string; totalQuestions: number;
  score: number; maxScore: number; percentage: number; correctCount: number; incorrectCount: number;
  unansweredCount: number; timeSpentSeconds: number; questionReview: ApiReview[];
}
export interface ApiStoredAttempt {
  id: string; testId: string; createdAt: string; score: number; maxScore: number; percentage: number;
  correctCount: number; incorrectCount: number; unansweredCount: number; timeSpentSeconds: number;
  test: { title: string }; userAnswers?: { question: ApiQuestion; selectedOptionId?: string }[];
}
const post = <T>(endpoint: string, data: unknown) => fetchFromBackend<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const apiService = {
  getExams: () => fetchFromBackend<ExamCategory[]>('/exams'),
  getTests: () => fetchFromBackend<ApiTest[]>('/tests'),
  getTestById: (id: string) => fetchFromBackend<ApiTest>(`/tests/${encodeURIComponent(id)}`),
  getPracticeSets: () => fetchFromBackend<PracticeSet[]>('/practice'),
  getUpdates: () => fetchFromBackend<NoticeUpdate[]>('/updates'),
  getQuestions: () => fetchFromBackend<ApiQuestion[]>('/questions'),
  submitAttempt: (data: { testId: string; answers: { questionId: string; selectedOptionId: string }[]; timeSpentSeconds: number }) => post<ApiResult>('/attempts', data),
  getUserAttempts: (id: string) => fetchFromBackend<ApiStoredAttempt[]>(`/attempts/user/${encodeURIComponent(id)}`),
  getAttemptById: (id: string) => fetchFromBackend<ApiStoredAttempt>(`/attempts/${encodeURIComponent(id)}`),
  createQuestion: (data: unknown) => post<ApiQuestion>('/questions', data),
  deleteQuestion: (id: string) => fetchFromBackend<undefined>(`/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  login: (data: { email: string; password: string }) => post<{ user: ApiUser; token: string }>('/auth/login', data),
  register: (data: { name: string; email: string; password: string; targetExam?: string }) => post<{ user: ApiUser; token: string }>('/auth/register', data),
  getMe: () => fetchFromBackend<ApiUser>('/auth/me'),
};

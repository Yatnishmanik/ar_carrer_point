import type { ExamCategory, NoticeUpdate, PracticeSet, Question } from '../types';
import type { BulkQuestionInput } from './question-import';

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
  tags?: string[];
  questionCount?: number; questions?: ApiQuestion[];
}
export interface ApiUser { username?: string | null; id: string; name: string; email: string; phone?: string; role: 'ADMIN' | 'STUDENT' | 'SUPERADMIN'; targetExam?: string; createdAt?: string }
export interface AdminOverview { users: ApiUser[]; totalUsers: number; totalTests: number; totalQuestions: number }
export interface ApiReview {
  timeSpentSeconds?: number | null; marksAwarded: number;
  questionId: string; questionText: string; options: Question['options']; correctOptionId?: string;
  userSelectedOptionId?: string; explanation?: string; subject?: string; marks: number; negativeMarks: number;
}
export interface ApiResult {
  durationMinutes: number; passingMarks: number;
  attemptId: string; testId: string; testTitle: string; timestamp: string; totalQuestions: number;
  score: number; maxScore: number; percentage: number; correctCount: number; incorrectCount: number;
  unansweredCount: number; timeSpentSeconds: number; questionReview: ApiReview[];
}
export interface LeaderboardEntry {
  rank: number; name: string; score: number; maxScore: number; timeSpentSeconds: number; createdAt: string;
}
export interface ApiStoredAttempt {
  id: string; testId: string; createdAt: string; score: number; maxScore: number; percentage: number;
  correctCount: number; incorrectCount: number; unansweredCount: number; timeSpentSeconds: number;
  test: { title: string; durationMinutes?: number; passingMarks?: number }; userAnswers?: { question: ApiQuestion; selectedOptionId?: string; timeSpentSeconds?: number | null; marksAwarded: number }[];
}
export interface AttemptPerformance { rank: number | null; totalParticipants: number; percentile: number | null }
export interface BulkImportResult { testId: string; importedCount: number; marksAdded: number; totalMarks: number }
const post = <T>(endpoint: string, data: unknown) => fetchFromBackend<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const apiService = {
  getExams: () => fetchFromBackend<ExamCategory[]>('/exams'),
  getTests: () => fetchFromBackend<ApiTest[]>('/tests'),
  getTestById: (id: string) => fetchFromBackend<ApiTest>(`/tests/${encodeURIComponent(id)}`),
  getTestLeaderboard: (id: string) => fetchFromBackend<LeaderboardEntry[]>(`/tests/${encodeURIComponent(id)}/leaderboard`),
  getPracticeSets: () => fetchFromBackend<PracticeSet[]>('/practice'),
  getUpdates: () => fetchFromBackend<NoticeUpdate[]>('/updates'),
  getQuestions: () => fetchFromBackend<ApiQuestion[]>('/questions'),
  submitAttempt: (data: { testId: string; answers: { questionId: string; selectedOptionId: string }[]; timeSpentSeconds: number; questionTimes?: { questionId: string; timeSpentSeconds: number }[] }) => post<ApiResult>('/attempts', data),
  getAttemptPerformance: (id: string) => fetchFromBackend<AttemptPerformance>(`/attempts/${encodeURIComponent(id)}/performance`),
  getUserAttempts: (id: string) => fetchFromBackend<ApiStoredAttempt[]>(`/attempts/user/${encodeURIComponent(id)}`),
  getAttemptById: (id: string) => fetchFromBackend<ApiStoredAttempt>(`/attempts/${encodeURIComponent(id)}`),
  createQuestion: (data: unknown) => post<ApiQuestion>('/questions', data),
  bulkImportQuestions: (testId: string, questions: BulkQuestionInput[]) => post<BulkImportResult>('/questions/bulk', { testId, questions }),
  createExamCategory: (data: { name: string; code: string; category: ExamCategory['category'] }) => post<ExamCategory>('/exams', data),
  deleteExamCategory: (id: string) => fetchFromBackend<void>(`/exams/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createTest: (data: { title: string; subtitle?: string; categoryId: string; durationMinutes: number; passingMarks: number; tags: string[] }) => post<ApiTest>('/tests', data),
  deleteQuestion: (id: string) => fetchFromBackend<undefined>(`/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  login: (data: { identifier: string; password: string }) => post<{ user: ApiUser; token: string }>('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) => post<{ user: ApiUser; token: string }>('/auth/register', data),
  checkAvailability: (field: 'username' | 'email', value: string, signal?: AbortSignal) => fetchFromBackend<{ available: boolean }>(`/auth/availability?${field}=${encodeURIComponent(value)}`, { signal }),
  getMe: () => fetchFromBackend<ApiUser>('/auth/me'),
  getAdminOverview: () => fetchFromBackend<AdminOverview>('/admin/overview'),
  createManagedUser: (data: { name: string; email: string; password: string; role: 'ADMIN' | 'STUDENT'; phone?: string; targetExam?: string }) => post<ApiUser>('/admin/users', data),
  updateManagedUser: (id: string, data: { name: string; email: string; role: 'ADMIN' | 'STUDENT'; password?: string; phone?: string; targetExam?: string }) => fetchFromBackend<ApiUser>(`/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteManagedUser: (id: string) => fetchFromBackend<{ id: string }>(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

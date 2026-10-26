/**
 * AR Career Point API Client
 * Configured to connect seamlessly to the Node.js + Express + Prisma + PostgreSQL backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchFromBackend<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[API Client] Error connecting to ${url}:`, error);
    throw error;
  }
}

export const apiService = {
  // Tests & Categories
  getExams: () => fetchFromBackend('/exams'),
  getTests: () => fetchFromBackend('/tests'),
  getTestById: (id: string) => fetchFromBackend(`/tests/${id}`),
  
  // Student Attempts & Grading
  submitAttempt: (data: {
    testId: string;
    userId?: string;
    answers: { questionId: string; selectedOptionId: string }[];
    timeSpentSeconds: number;
  }) =>
    fetchFromBackend('/attempts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getUserAttempts: (userId: string) => fetchFromBackend(`/attempts/user/${userId}`),

  // Admin Question & Test Bank
  createQuestion: (questionData: unknown) =>
    fetchFromBackend('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    }),

  deleteQuestion: (questionId: string) =>
    fetchFromBackend(`/questions/${questionId}`, {
      method: 'DELETE',
    }),

  // Authentication
  login: (credentials: { email: string; password: string }) =>
    fetchFromBackend('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData: { name: string; email: string; password: string; targetExam?: string }) =>
    fetchFromBackend('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

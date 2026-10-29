import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import type { Server } from 'node:http';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { generateToken } from '../src/utils/jwt';
import { gradeAttempt } from '../src/utils/grading';
import { promoteAdmin } from '../src/scripts/promote-admin';

// Never run integration fixtures against an application database.
const db = new URL(process.env.DATABASE_URL!);
assert.equal(process.env.NODE_ENV, 'test');
assert.match(db.pathname, /test/i);
assert.ok(['localhost', '127.0.0.1'].includes(db.hostname));

let server: Server;
let base: string;
let studentId: string;
let studentToken: string;
let adminToken: string;
let adminId: string;
let testId: string;
let hiddenTestId: string;
let draftTestId: string;
let questionId: string;
let correctOptionId: string;
let attemptId: string;
const email = `review-${Date.now()}@example.com`;
const password = 'test-password-12345';

async function request(path: string, token?: string, body?: unknown, method?: string) {
  const response = await fetch(`${base}/api${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}`;
  const admin = await prisma.user.create({ data: { name: 'Test Admin', email: `admin-${email}`, password: await bcrypt.hash(password, 10), role: 'ADMIN' } });
  adminId = admin.id;
  adminToken = generateToken({ userId: admin.id, email: admin.email, role: 'ADMIN' });
  const test = await prisma.test.create({ data: { title: 'Integration Test', categoryName: 'Science', durationMinutes: 1, isPublished: false } });
  testId = test.id;
  const hidden = await prisma.test.create({ data: { title: 'Draft', categoryName: 'Science', isPublished: false } });
  hiddenTestId = hidden.id;
});

after(async () => {
  if (testId) await prisma.test.deleteMany({ where: { id: { in: [testId, hiddenTestId, draftTestId].filter(Boolean) } } });
  await prisma.user.deleteMany({ where: { email: { in: [email, `admin-${email}`] } } });
  await prisma.$disconnect();
  if (server) await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
});

describe('Authentication, authorization and test integrity', () => {
  it('cannot register an administrator through public registration', async () => {
    const r = await request('/auth/register', undefined, { name: 'Student', email, password, role: 'ADMIN' });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.user.role, 'STUDENT');
    studentToken = r.body.data.token;
    studentId = r.body.data.user.id;
    assert.equal((await request('/questions', studentToken)).status, 403);
  });

  it('validates registration types and passwords and rejects wrong login passwords', async () => {
    assert.equal((await request('/auth/register', undefined, { name: 7, email, password })).status, 400);
    assert.equal((await request('/auth/register', undefined, { name: 'X', email, password: 'short' })).status, 400);
    assert.equal((await request('/auth/login', undefined, { email, password: 'incorrect' })).status, 401);
    assert.equal((await request('/auth/login', undefined, { email, password })).status, 200);
    assert.equal((await request('/auth/me', studentToken)).body.data.id, studentId);
  });

  it('requires authentication for all attempt routes and the answer bank', async () => {
    for (const path of ['/questions', `/attempts/user/${studentId}`, '/attempts/fake']) {
      assert.equal((await request(path)).status, 401);
    }
    assert.equal((await request('/attempts', undefined, { testId })).status, 401);
    assert.equal((await request(`/attempts/user/${adminId}`, studentToken)).status, 403);
  });

  it('allows admins to save questions and atomically update marks', async () => {
    const r = await request('/questions', adminToken, { testId, questionText: '2 + 2?', marks: 2, negativeMarks: 0.5,
      explanation: 'Two plus two is four.', options: [{ text: '4', isCorrect: true }, { text: '5', isCorrect: false }] });
    assert.equal(r.status, 201);
    questionId = r.body.data.id;
    correctOptionId = r.body.data.options.find((o: { isCorrect: boolean }) => o.isCorrect).id;
    assert.equal((await prisma.test.findUniqueOrThrow({ where: { id: testId } })).totalMarks, 2);
    assert.equal((await request('/questions', adminToken)).status, 200);
    assert.equal((await request('/questions', studentToken, { testId })).status, 403);
    assert.equal((await request(`/tests/${testId}`, adminToken, { isPublished: true }, 'PATCH')).status, 200);
  });

  it('does not expose answer keys or explanations before submission and hides drafts', async () => {
    const r = await request(`/tests/${testId}`);
    assert.equal(r.status, 200);
    assert.ok(!('explanation' in r.body.data.questions[0]));
    assert.ok(r.body.data.questions[0].options.every((o: object) => !('isCorrect' in o)));
    assert.equal((await request(`/tests/${hiddenTestId}`)).status, 404);
  });

  it('combines category and search filters instead of replacing one with the other', async () => {
    const matching = await request('/tests?category=Science&search=Integration');
    assert.ok(matching.body.data.some((t: { id: string }) => t.id === testId));
    const wrongCategory = await request('/tests?category=Unrelated&search=Integration');
    assert.equal(wrongCategory.body.data.length, 0);
  });

  it('rejects invalid question keys and rolls back a question if its test is missing', async () => {
    const payload = { testId, questionText: 'Invalid', marks: 1, negativeMarks: 0,
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }] };
    assert.equal((await request('/questions', adminToken, payload)).status, 400);
    const beforeCount = await prisma.question.count();
    const r = await request('/questions', adminToken, { ...payload, testId: 'missing-test',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] });
    assert.ok(r.status >= 400);
    assert.equal(await prisma.question.count(), beforeCount);
    assert.equal((await prisma.test.findUniqueOrThrow({ where: { id: testId } })).totalMarks, 2);
  });

  it('rejects malformed, duplicate and foreign answers without saving attempts', async () => {
    const valid = { questionId, selectedOptionId: correctOptionId };
    for (const answers of [null, [valid, valid], [{ ...valid, selectedOptionId: 'foreign' }], [{ ...valid, questionId: 'foreign' }]]) {
      assert.equal((await request('/attempts', studentToken, { testId, answers, timeSpentSeconds: 1 })).status, 400);
    }
    assert.equal((await request('/attempts', studentToken, { testId, answers: [], timeSpentSeconds: -1 })).status, 400);
    assert.equal((await request('/attempts', studentToken, { testId, answers: [], timeSpentSeconds: 61 })).status, 400);
    assert.equal(await prisma.testAttempt.count({ where: { testId } }), 0);
  });

  it('grades on the server, ignores supplied userId, and saves answer review', async () => {
    const r = await request('/attempts', studentToken, { testId, userId: adminId, score: 999, answers: [{ questionId, selectedOptionId: correctOptionId }], timeSpentSeconds: 5 });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.score, 2);
    assert.equal(r.body.data.questionReview[0].correctOptionId, correctOptionId);
    attemptId = r.body.data.attemptId;
    assert.equal((await prisma.testAttempt.findUniqueOrThrow({ where: { id: attemptId } })).userId, studentId);
    const history = await request(`/attempts/user/${studentId}`, studentToken);
    assert.equal(history.body.data.length, 1);
    const review = await request(`/attempts/${attemptId}`, studentToken);
    assert.equal(review.body.data.userAnswers[0].question.options.length, 2);
  });

  it('denies access to other students even with a valid token', async () => {
    // Admin token claims are resolved against the current database role on every request.
    await prisma.user.update({ where: { id: adminId }, data: { role: 'STUDENT' } });
    assert.equal((await request(`/attempts/${attemptId}`, adminToken)).status, 404);
    assert.equal((await request('/questions', adminToken)).status, 403);
    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
    assert.equal((await request(`/attempts/${attemptId}`, adminToken)).status, 200);
  });

  it('keeps historical answer review when admins try to delete a used question', async () => {
    assert.equal((await request(`/questions/${questionId}`, adminToken, undefined, 'DELETE')).status, 409);
    assert.equal(await prisma.userAnswer.count({ where: { attemptId } }), 1);
  });

  it('handles negative marking, skipped questions and fractional marks consistently', () => {
    const q = (id: string) => ({ id, marks: 1.5, negativeMarks: 0.25, options: [{ id: `${id}-a`, isCorrect: true }, { id: `${id}-b`, isCorrect: false }] });
    const r = gradeAttempt([q('a'), q('b'), q('c')], [{ questionId: 'a', selectedOptionId: 'a-a' }, { questionId: 'b', selectedOptionId: 'b-b' }]);
    assert.equal(r.score, 1.25); assert.equal(r.maxScore, 4.5);
    assert.equal(r.correctCount, 1); assert.equal(r.incorrectCount, 1); assert.equal(r.unansweredCount, 1);
  });

  it('does not turn a failing score into a pass by rounding the displayed percentage', () => {
    const questions = [
      { id: 'q1', marks: 3.96, negativeMarks: 0, options: [{ id: 'a', isCorrect: true }] },
      { id: 'q2', marks: 6.04, negativeMarks: 0, options: [{ id: 'b', isCorrect: true }] },
    ];
    const result = gradeAttempt(questions, [{ questionId: 'q1', selectedOptionId: 'a' }], 40);
    assert.equal(result.percentage, 40);
    assert.equal(result.passed, false);
    assert.equal(gradeAttempt([], [], 0).passed, false);
  });
  it('distinguishes admin sign-in without letting students choose an admin role', async () => {
    assert.equal((await request('/auth/admin/login', undefined, { email, password: 'wrong' })).status, 401);
    const studentLogin = await request('/auth/admin/login', undefined, { email, password, role: 'ADMIN' });
    assert.equal(studentLogin.status, 403);
    assert.ok(!studentLogin.body.data?.token);
    const adminLogin = await request('/auth/admin/login', undefined, { email: `admin-${email}`, password });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.data.user.role, 'ADMIN');
  });

  it('requires admin access for test creation, draft listing and publishing', async () => {
    for (const token of [undefined, studentToken]) {
      const status = token ? 403 : 401;
      assert.equal((await request('/tests/admin', token)).status, status);
      assert.equal((await request('/tests', token, { title: 'Forbidden', categoryName: 'Science' })).status, status);
      assert.equal((await request(`/tests/${testId}`, token, { isPublished: false }, 'PATCH')).status, status);
    }
    assert.equal((await request('/tests/admin', adminToken)).status, 200);
  });

  it('validates test creation and always creates a private draft with computed marks', async () => {
    for (const body of [
      { title: '', categoryName: 'Science' }, { title: 'X', categoryName: 'Science', durationMinutes: 0 },
      { title: 'X', categoryName: 'Science', durationMinutes: 1.5 }, { title: 'X', categoryName: 'Science', passingMarks: -1 },
      { title: 'X', categoryName: 'Science', instructions: [false] }, { title: 'X', categoryId: 'missing' },
    ]) assert.equal((await request('/tests', adminToken, body)).status, 400);
    const created = await request('/tests', adminToken, { title: 'Admin draft workflow', categoryName: 'Custom exam', durationMinutes: 20, passingMarks: 2, totalMarks: 999, isPublished: true });
    assert.equal(created.status, 201);
    draftTestId = created.body.data.id;
    assert.equal(created.body.data.isPublished, false);
    assert.equal(created.body.data.totalMarks, 0);
    assert.equal(created.body.data.questionCount, 0);
    assert.equal((await request(`/tests/${draftTestId}`)).status, 404);
    assert.ok(!(await request('/tests')).body.data.some((test: { id: string }) => test.id === draftTestId));
    assert.ok((await request('/tests/admin', adminToken)).body.data.some((test: { id: string }) => test.id === draftTestId));
    assert.equal((await request(`/tests/${draftTestId}`, adminToken, { isPublished: true }, 'PATCH')).status, 400);
  });

  it('supports the full draft, question, publish and student attempt workflow', async () => {
    const question = { testId: draftTestId, questionText: 'Which is correct?', marks: 1, negativeMarks: 0,
      options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] };
    const first = await request('/questions', adminToken, question);
    assert.equal(first.status, 201);
    // The requested pass mark is higher than this unfinished draft's total.
    assert.equal((await request(`/tests/${draftTestId}`, adminToken, { isPublished: true }, 'PATCH')).status, 400);
    const second = await request('/questions', adminToken, { ...question, questionText: 'Second question' });
    assert.equal(second.status, 201);
    const published = await request(`/tests/${draftTestId}`, adminToken, { isPublished: true }, 'PATCH');
    assert.equal(published.status, 200);
    assert.equal(published.body.data.totalMarks, 2);
    assert.equal(published.body.data.questionCount, 2);
    const publicTest = await request(`/tests/${draftTestId}`);
    assert.equal(publicTest.status, 200);
    assert.ok(publicTest.body.data.questions.every((q: { options: object[] }) => q.options.every(o => !('isCorrect' in o))));
    assert.equal((await request('/questions', adminToken, question)).status, 409);
    assert.equal((await request(`/questions/${first.body.data.id}`, adminToken, undefined, 'DELETE')).status, 409);
    const submitted = await request('/attempts', studentToken, { testId: draftTestId, timeSpentSeconds: 10,
      answers: [first, second].map(r => ({ questionId: r.body.data.id, selectedOptionId: r.body.data.options.find((o: { isCorrect: boolean }) => o.isCorrect).id })) });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.body.data.score, 2);
    assert.equal(submitted.body.data.passed, true);
    assert.equal((await request(`/tests/${draftTestId}`, adminToken, { isPublished: false }, 'PATCH')).status, 200);
    assert.equal((await request(`/tests/${draftTestId}`)).status, 404);
    assert.equal((await request('/questions', adminToken, question)).status, 409);
  });

  it('keeps user roles admin-only and never returns password hashes', async () => {
    assert.equal((await request('/users')).status, 401);
    assert.equal((await request('/users', studentToken)).status, 403);
    assert.equal((await request(`/users/${studentId}/role`, studentToken, { role: 'ADMIN' }, 'PATCH')).status, 403);
    const users = await request(`/users?search=${encodeURIComponent(email)}`, adminToken);
    assert.equal(users.status, 200);
    assert.ok(users.body.data.length >= 2);
    assert.ok(users.body.data.every((user: object) => !('password' in user)));
    assert.equal((await request(`/users/${studentId}/role`, adminToken, { role: 'OWNER' }, 'PATCH')).status, 400);
    assert.equal((await request(`/users/${adminId}/role`, adminToken, { role: 'STUDENT' }, 'PATCH')).status, 409);
  });

  it('grants and revokes admin roles with immediate effect on existing sessions', async () => {
    assert.equal((await request(`/users/${studentId}/role`, adminToken, { role: 'ADMIN' }, 'PATCH')).status, 200);
    assert.equal((await request('/tests/admin', studentToken)).status, 200);
    const login = await request('/auth/admin/login', undefined, { email, password });
    assert.equal(login.status, 200);
    assert.equal((await request(`/users/${studentId}/role`, adminToken, { role: 'STUDENT' }, 'PATCH')).status, 200);
    assert.equal((await request('/tests/admin', login.body.data.token)).status, 403);
    assert.equal((await request('/auth/me', login.body.data.token)).body.data.role, 'STUDENT');
  });

  it('promotes an existing account from the operator command without resetting its password', async () => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: studentId } });
    await promoteAdmin(` ${email.toUpperCase()} `);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: studentId } });
    assert.equal(after.role, 'ADMIN');
    assert.equal(after.password, before.password);
    assert.equal((await request('/auth/admin/login', undefined, { email, password })).status, 200);
    await prisma.user.update({ where: { id: studentId }, data: { role: 'STUDENT' } });
    await assert.rejects(() => promoteAdmin('invalid-email'));
  });

  it('preserves saved results when an admin requests test deletion', async () => {
    assert.equal((await request(`/tests/${testId}`, adminToken, undefined, 'DELETE')).status, 409);
    assert.equal((await request(`/attempts/${attemptId}`, studentToken)).status, 200);
  });

  it('serializes simultaneous role revocations without letting a revoked admin keep changing roles', async () => {
    await prisma.user.update({ where: { id: studentId }, data: { role: 'ADMIN' } });
    const otherAdminToken = generateToken({ userId: studentId, email, role: 'ADMIN' });
    try {
      const results = await Promise.all([
        request(`/users/${studentId}/role`, adminToken, { role: 'STUDENT' }, 'PATCH'),
        request(`/users/${adminId}/role`, otherAdminToken, { role: 'STUDENT' }, 'PATCH'),
      ]);
      assert.equal(results.filter(result => result.status === 200).length, 1);
      assert.ok(results.some(result => result.status === 403 || result.status === 409));
    } finally {
      await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
      await prisma.user.update({ where: { id: studentId }, data: { role: 'STUDENT' } });
    }
  });

});

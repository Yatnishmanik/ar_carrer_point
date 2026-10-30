import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { generateToken } from '../src/utils/jwt';

const db = new URL(process.env.DATABASE_URL!);
assert.equal(process.env.NODE_ENV, 'test');
assert.match(db.pathname, /test/i);
assert.ok(['localhost', '127.0.0.1'].includes(db.hostname));
const prefix = randomUUID();
const userIds = Array.from({ length: 30 }, () => randomUUID());
const testIds = Array.from({ length: 3 }, () => randomUUID());
const me = userIds[0];
const token = (i: number) => generateToken({ userId: userIds[i], email: `${prefix}-${i}@example.com`, role: i === 29 ? 'ADMIN' : 'STUDENT' });
let server: Server;
let base: string;
let latestId: string;
const attempt = (userId: string | null, score: number, seconds: number, date: string, testId = testIds[0]) => ({
  id: randomUUID(), userId, testId, score, maxScore: 100, percentage: score, passed: score >= 40,
  correctCount: Math.floor(score), incorrectCount: 0, unansweredCount: 100 - Math.floor(score), timeSpentSeconds: seconds, createdAt: new Date(date),
});
async function get(id = testIds[0], auth: string | undefined = token(0), suffix = '') {
  const response = await fetch(`${base}/api/tests/${id}/scoreboard${suffix}`, { headers: auth ? { Authorization: `Bearer ${auth}` } : {} });
  return { status: response.status, headers: response.headers, body: await response.json() };
}

before(async () => {
  await prisma.user.createMany({ data: userIds.map((id, i) => ({ id, email: `${prefix}-${i}@example.com`,
    name: i === 1 || i === 2 ? 'Same Display Name' : `Scoreboard Student ${i}`, password: 'unused-test-hash', role: i === 29 ? 'ADMIN' : 'STUDENT' })) });
  await prisma.test.createMany({ data: testIds.map((id, i) => ({ id, title: `Scoreboard fixture ${prefix}-${i}`, categoryName: 'Scoreboard', isPublished: i !== 2 })) });
  const latest = attempt(me, 70, 10, '2026-01-03T10:00:00Z');
  latestId = latest.id;
  await prisma.testAttempt.createMany({ data: [
    attempt(me, 80, 100, '2026-01-01T10:00:00Z'), attempt(me, 90, 120, '2026-01-02T10:00:00Z'), latest,
    attempt(userIds[1], 90, 90, '2026-01-02T10:00:00Z'), attempt(userIds[2], 90, 90, '2026-01-01T10:00:00Z'),
    attempt(userIds[29], 100, 1, '2026-01-01T10:00:00Z'), attempt(null, 100, 1, '2026-01-01T10:00:00Z'),
    attempt(userIds[1], 100, 1, '2026-01-01T10:00:00Z', testIds[1]),
    attempt(me, 100, 1, '2026-01-01T10:00:00Z', testIds[2]),
  ] });
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  base = `http://127.0.0.1:${address.port}`;
});
after(async () => {
  await prisma.test.deleteMany({ where: { id: { in: testIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe('Attempt scoreboard and leaderboard', () => {
  it('requires login and hides missing or unpublished tests', async () => {
    assert.equal((await get(testIds[0], '')).status, 401);
    assert.equal((await get('missing-test')).status, 404);
    assert.equal((await get(testIds[2])).status, 404);
  });
  it('leaves a first-time student on the normal flow without sharing other scores', async () => {
    const response = await get(testIds[0], token(28));
    assert.equal(response.status, 200);
    assert.equal(response.body.data.hasAttempted, false);
    assert.equal(response.body.data.latestAttempt, null);
    assert.equal(response.body.data.attemptCount, 0);
    assert.deepEqual(response.body.data.attempts, []);
    assert.deepEqual(response.body.data.leaderboard, []);
    assert.equal(response.body.data.yourBest, null);
  });
  it('returns the caller latest result, date, duration and history separately from their best score', async () => {
    const response = await get(); const data = response.body.data;
    assert.equal(data.hasAttempted, true);
    assert.equal(data.attemptCount, 3);
    assert.equal(data.latestAttempt.id, latestId);
    assert.equal(data.latestAttempt.score, 70);
    assert.equal(data.latestAttempt.timeSpentSeconds, 10);
    assert.equal(data.latestAttempt.createdAt, '2026-01-03T10:00:00.000Z');
    assert.equal(data.latestAttempt.passed, true);
    assert.equal(data.yourBest.score, 90);
    assert.equal(data.yourBest.rank, 3);
    assert.match(response.headers.get('cache-control') || '', /private, no-store/);
  });
  it('ranks one best attempt per student, breaking ties by time then earlier date', async () => {
    const data = (await get()).body.data;
    assert.equal(data.participantCount, 3); // excludes admins, guests and attempts on other tests
    assert.equal(data.leaderboard.length, 3);
    assert.deepEqual(data.leaderboard.map((row: { timeSpentSeconds: number }) => row.timeSpentSeconds), [90, 90, 120]);
    assert.deepEqual(data.leaderboard.map((row: { rank: number }) => row.rank), [1, 2, 3]);
    assert.equal(data.leaderboard[0].createdAt, '2026-01-01T10:00:00.000Z');
    assert.equal(data.leaderboard.filter((row: { isYou: boolean }) => row.isYou).length, 1);
    assert.equal(data.leaderboard[0].name, data.leaderboard[1].name); // distinct users can share a display name
  });
  it('does not expose private identifiers, emails, answer keys or another user history', async () => {
    const data = (await get(testIds[0], token(0), `?userId=${userIds[1]}`)).body.data;
    assert.equal(data.latestAttempt.id, latestId);
    assert.equal(data.attempts.length, 3);
    for (const row of data.leaderboard) {
      for (const field of ['id', 'userId', 'email', 'password', 'userAnswers', 'questionReview']) assert.ok(!(field in row));
      assert.ok(!JSON.stringify(row).includes(prefix));
    }
  });
  it('updates the best ranking after a retry without duplicating the student', async () => {
    await prisma.testAttempt.create({ data: attempt(me, 95, 180, '2026-01-04T10:00:00Z') });
    const data = (await get()).body.data;
    assert.equal(data.latestAttempt.score, 95);
    assert.equal(data.yourBest.score, 95);
    assert.equal(data.yourBest.rank, 1);
    assert.equal(data.attemptCount, 4);
    assert.equal(data.leaderboard.length, 3);
    assert.equal(data.leaderboard.filter((row: { isYou: boolean }) => row.isYou).length, 1);
  });
  it('bounds personal history while preserving older best results and total attempt count', async () => {
    await prisma.testAttempt.createMany({ data: Array.from({ length: 12 }, (_, i) => attempt(me, 20 + i, i, `2026-02-${String(i + 1).padStart(2, '0')}T10:00:00Z`)) });
    const data = (await get()).body.data;
    assert.equal(data.attempts.length, 10);
    assert.equal(data.attemptCount, 16);
    assert.equal(data.latestAttempt.score, 31);
    assert.equal(data.latestAttempt.passed, false);
    assert.equal(data.yourBest.score, 95);
  });
  it('returns a personal rank outside the top 20 without expanding the public leaderboard', async () => {
    await prisma.testAttempt.createMany({ data: [attempt(me, 1, 10, '2026-03-01T10:00:00Z', testIds[1]),
      ...userIds.slice(1, 26).map((id, i) => attempt(id, 100 - i, 10, '2026-03-01T10:00:00Z', testIds[1]))] });
    const data = (await get(testIds[1])).body.data;
    assert.equal(data.participantCount, 26);
    assert.equal(data.leaderboard.length, 20);
    assert.equal(data.yourBest.rank, 26);
    assert.ok(!data.leaderboard.some((row: { isYou: boolean }) => row.isYou));
  });
});

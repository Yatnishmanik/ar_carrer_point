import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

interface RankedAttempt {
  userId: string;
  name: string;
  rank: number;
  participantCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  createdAt: Date;
}

export async function getTestScoreboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const testId = String(req.params.id);
    const userId = req.user!.userId;
    // Keep the caller's summaries, ranks and participant count on one consistent snapshot.
    const data = await prisma.$transaction(async tx => {
      const test = await tx.test.findFirst({
        where: { id: testId, isPublished: true },
        select: { id: true, title: true, durationMinutes: true },
      });
      if (!test) throw Object.assign(new Error('Test not found.'), { status: 404 });
      const where = { testId, userId };
      const [attempts, attemptCount] = await Promise.all([
        tx.testAttempt.findMany({
          where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 10,
          select: { id: true, score: true, maxScore: true, percentage: true, passed: true,
            timeSpentSeconds: true, createdAt: true, correctCount: true, incorrectCount: true, unansweredCount: true },
        }),
        tx.testAttempt.count({ where }),
      ]);
      if (!attempts.length) return { test, hasAttempted: false, attemptCount: 0, latestAttempt: null,
        attempts: [], leaderboard: [], yourBest: null, participantCount: 0 };

      // Window functions select one best attempt per student and rank in the database.
      // Values are bound parameters; no client user ID or SQL fragment is trusted.
      const rows = await tx.$queryRaw<RankedAttempt[]>`
        WITH best_attempts AS (
          SELECT a.*, u.name,
            ROW_NUMBER() OVER (PARTITION BY a."userId"
              ORDER BY a.score DESC, a."timeSpentSeconds" ASC, a."createdAt" ASC, a.id ASC) AS personal_best
          FROM test_attempts a JOIN users u ON u.id = a."userId"
          WHERE a."testId" = ${testId} AND u.role = 'STUDENT'
        ), ranked AS (
          SELECT *,
            (ROW_NUMBER() OVER (ORDER BY score DESC, "timeSpentSeconds" ASC, "createdAt" ASC, id ASC))::integer AS rank,
            (COUNT(*) OVER ())::integer AS "participantCount"
          FROM best_attempts WHERE personal_best = 1
        )
        SELECT "userId", name, rank, "participantCount", score, "maxScore", percentage,
          passed, "timeSpentSeconds", "createdAt"
        FROM ranked WHERE rank <= 20 OR "userId" = ${userId} ORDER BY rank ASC
      `;
      const entry = (row: RankedAttempt) => ({ rank: row.rank, name: row.name,
        score: row.score, maxScore: row.maxScore, percentage: row.percentage, passed: row.passed,
        timeSpentSeconds: row.timeSpentSeconds, createdAt: row.createdAt, isYou: row.userId === userId });
      const ownBest = rows.find(row => row.userId === userId);
      return { test, hasAttempted: true, attemptCount, latestAttempt: attempts[0], attempts,
        leaderboard: rows.filter(row => row.rank <= 20).map(entry),
        yourBest: ownBest ? entry(ownBest) : null, participantCount: rows[0]?.participantCount || 0 };
    }, { isolationLevel: 'RepeatableRead' });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ success: true, data });
  } catch (error) { next(error); }
}

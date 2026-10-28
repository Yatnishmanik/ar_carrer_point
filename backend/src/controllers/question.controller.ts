import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const addQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      testId,
      questionText,
      subject,
      explanation,
      marks = 1.0,
      negativeMarks = 0.25,
      options, // array of { text: string, isCorrect: boolean }
    } = req.body;

    if (typeof questionText !== 'string' || !questionText.trim() ||
        (testId !== undefined && typeof testId !== 'string') ||
        (subject !== undefined && typeof subject !== 'string') ||
        (explanation !== undefined && typeof explanation !== 'string') ||
        typeof marks !== 'number' || !Number.isFinite(marks) || marks <= 0 ||
        typeof negativeMarks !== 'number' || !Number.isFinite(negativeMarks) || negativeMarks < 0 ||
        !Array.isArray(options) || options.length < 2 ||
        options.some(opt => !opt || typeof opt.text !== 'string' || !opt.text.trim() || typeof opt.isCorrect !== 'boolean') ||
        options.filter(opt => opt.isCorrect).length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Provide a question, positive marks, non-negative penalty, and at least two options with exactly one correct answer.',
      });
    }

    const createdQuestion = await prisma.$transaction(async tx => {
      const created = await tx.question.create({
        data: {
          testId: testId || null,
          questionText: questionText.trim(),
          subject: subject ? subject.trim() : null,
          explanation: explanation ? explanation.trim() : null,
          marks: Number(marks),
          negativeMarks: Number(negativeMarks),
          options: {
            create: options.map((opt: { text: string; isCorrect: boolean }, index: number) => ({
              text: opt.text.trim(),
              isCorrect: Boolean(opt.isCorrect),
              order: index,
            })),
          },
        },
        include: {
          options: true,
        },
      });

      // Update parent test's totalMarks if associated with a test
      if (testId) {
        await tx.test.update({
          where: { id: testId },
          data: {
            totalMarks: {
              increment: Number(marks),
            },
          },
        });
      }

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'प्रश्न सफलतापूर्वक जोड़ा गया (Question added successfully)',
      data: createdQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const id = String(Array.isArray(rawId) ? rawId[0] : rawId);

    await prisma.$transaction(async tx => {
      const existing = await tx.question.findUnique({ where: { id }, include: { _count: { select: { userAnswers: true } } } });
      if (!existing) throw Object.assign(new Error('Question not found'), { status: 404 });
      if (existing._count.userAnswers) throw Object.assign(new Error('Questions used in submitted tests cannot be deleted.'), { status: 409 });
      await tx.question.delete({ where: { id } });
      if (existing.testId) await tx.test.update({ where: { id: existing.testId }, data: { totalMarks: { decrement: existing.marks } } });
    });

    return res.status(200).json({
      success: true,
      message: 'प्रश्न हटाया गया (Question removed successfully)',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId, subject } = req.query;

    const where: Record<string, unknown> = {};
    if (testId && typeof testId === 'string') where.testId = testId;
    if (subject && typeof subject === 'string') where.subject = subject;

    const questions = await prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        test: {
          select: { title: true, categoryName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};

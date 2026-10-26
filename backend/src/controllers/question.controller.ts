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

    if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Question text and at least 2 options are required',
      });
    }

    const createdQuestion = await prisma.question.create({
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
      await prisma.test.update({
        where: { id: testId },
        data: {
          totalMarks: {
            increment: Number(marks),
          },
        },
      });
    }

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

    const existing = await prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    await prisma.question.delete({
      where: { id },
    });

    // Deduct marks if attached to test
    if (existing.testId) {
      await prisma.test.update({
        where: { id: existing.testId },
        data: {
          totalMarks: {
            decrement: existing.marks,
          },
        },
      });
    }

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

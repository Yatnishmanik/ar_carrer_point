import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category && typeof category === 'string' && category !== 'all') {
      where.OR = [
        { categoryName: { contains: category, mode: 'insensitive' } },
        { category: { category: { equals: category } } },
      ];
    }

    if (search && typeof search === 'string') {
      where.AND = [{ OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { categoryName: { contains: search, mode: 'insensitive' } },
      ] }];
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = tests.map((t) => ({
      ...t,
      questionCount: t._count.questions,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const id = String(Array.isArray(rawId) ? rawId[0] : rawId);

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          omit: { explanation: true },
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                order: true,
                // Exclude isCorrect during test taking to protect integrity
              },
            },
          },
        },
      },
    });

    if (!test || !test.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'टेस्ट नहीं मिला (Test not found)',
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

export const createTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      subtitle,
      categoryId,
      categoryName,
      durationMinutes,
      totalMarks,
      passingMarks,
      instructions,
    } = req.body;

    if (!title || !categoryName) {
      return res.status(400).json({
        success: false,
        message: 'Title and categoryName are required',
      });
    }

    const newTest = await prisma.test.create({
      data: {
        title,
        subtitle,
        categoryId: categoryId || null,
        categoryName,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 10,
        totalMarks: totalMarks ? Number(totalMarks) : 0,
        passingMarks: passingMarks ? Number(passingMarks) : 0,
        instructions: instructions || [],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'नया टेस्ट सफलतापूर्वक बनाया गया',
      data: newTest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const id = String(Array.isArray(rawId) ? rawId[0] : rawId);

    await prisma.test.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'टेस्ट हटा दिया गया (Test deleted successfully)',
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;

    const whereClause: { category?: string } = {};
    if (category && typeof category === 'string' && category !== 'all') {
      whereClause.category = category;
    }

    const exams = await prisma.examCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { tests: { where: { isPublished: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = exams.map((ex) => ({
      ...ex,
      testCount: ex._count.tests,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, icon, colorClass, accentColor, gradient, items, category } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Exam name and code are required',
      });
    }

    const exam = await prisma.examCategory.create({
      data: {
        name,
        code,
        icon: icon || '📕',
        colorClass,
        accentColor,
        gradient,
        items: items || [],
        category: category || 'all',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Exam category created successfully',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

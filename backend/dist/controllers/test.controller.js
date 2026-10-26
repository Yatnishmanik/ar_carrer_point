"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTest = exports.createTest = exports.getTestById = exports.getTests = void 0;
const prisma_1 = require("../lib/prisma");
const getTests = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        const where = {
            isPublished: true,
        };
        if (category && typeof category === 'string' && category !== 'all') {
            where.OR = [
                { categoryName: { contains: category, mode: 'insensitive' } },
                { category: { category: { equals: category } } },
            ];
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { subtitle: { contains: search, mode: 'insensitive' } },
                { categoryName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const tests = await prisma_1.prisma.test.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTests = getTests;
const getTestById = async (req, res, next) => {
    try {
        const rawId = req.params.id;
        const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
        const test = await prisma_1.prisma.test.findUnique({
            where: { id },
            include: {
                questions: {
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
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'टेस्ट नहीं मिला (Test not found)',
            });
        }
        return res.status(200).json({
            success: true,
            data: test,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTestById = getTestById;
const createTest = async (req, res, next) => {
    try {
        const { title, subtitle, categoryId, categoryName, durationMinutes, totalMarks, passingMarks, instructions, } = req.body;
        if (!title || !categoryName) {
            return res.status(400).json({
                success: false,
                message: 'Title and categoryName are required',
            });
        }
        const newTest = await prisma_1.prisma.test.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createTest = createTest;
const deleteTest = async (req, res, next) => {
    try {
        const rawId = req.params.id;
        const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
        await prisma_1.prisma.test.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: 'टेस्ट हटा दिया गया (Test deleted successfully)',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTest = deleteTest;

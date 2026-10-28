"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExam = exports.getExams = void 0;
const prisma_1 = require("../lib/prisma");
const getExams = async (req, res, next) => {
    try {
        const { category } = req.query;
        const whereClause = {};
        if (category && typeof category === 'string' && category !== 'all') {
            whereClause.category = category;
        }
        const exams = await prisma_1.prisma.examCategory.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getExams = getExams;
const createExam = async (req, res, next) => {
    try {
        const { name, code, icon, colorClass, accentColor, gradient, items, category } = req.body;
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Exam name and code are required',
            });
        }
        const exam = await prisma_1.prisma.examCategory.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createExam = createExam;

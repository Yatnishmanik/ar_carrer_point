"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTest = exports.setTestPublished = exports.createTest = exports.getAdminTests = exports.getTestById = exports.getTests = void 0;
const prisma_1 = require("../lib/prisma");
const transaction_1 = require("../utils/transaction");
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
            where.AND = [{ OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { subtitle: { contains: search, mode: 'insensitive' } },
                        { categoryName: { contains: search, mode: 'insensitive' } },
                    ] }];
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTestById = getTestById;
const getAdminTests = async (_req, res, next) => {
    try {
        const tests = await prisma_1.prisma.test.findMany({ include: { _count: { select: { questions: true, attempts: true } } }, orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: tests.map(t => ({ ...t, questionCount: t._count.questions, attemptCount: t._count.attempts })) });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminTests = getAdminTests;
const createTest = async (req, res, next) => {
    try {
        const { title, subtitle = '', categoryId, categoryName, durationMinutes = 10, passingMarks = 0, instructions = [] } = req.body || {};
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 ||
            typeof subtitle !== 'string' || subtitle.length > 500 ||
            (categoryId !== undefined && typeof categoryId !== 'string') ||
            (categoryName !== undefined && typeof categoryName !== 'string') ||
            !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 480 ||
            typeof passingMarks !== 'number' || !Number.isFinite(passingMarks) || passingMarks < 0 ||
            !Array.isArray(instructions) || instructions.length > 20 || instructions.some(i => typeof i !== 'string' || i.length > 1000)) {
            return res.status(400).json({ success: false, message: 'Provide a title, duration of 1–480 minutes, non-negative passing marks and valid instructions.' });
        }
        const category = categoryId ? await prisma_1.prisma.examCategory.findUnique({ where: { id: categoryId } }) : null;
        if (categoryId && !category)
            return res.status(400).json({ success: false, message: 'Select an existing exam category.' });
        const name = category?.name || categoryName?.trim();
        if (!name)
            return res.status(400).json({ success: false, message: 'Select an exam category or enter a category name.' });
        const test = await prisma_1.prisma.test.create({ data: {
                title: title.trim(), subtitle: subtitle.trim(), categoryId: category?.id || null, categoryName: name,
                durationMinutes, passingMarks, instructions: instructions.map(i => i.trim()).filter(Boolean), totalMarks: 0, isPublished: false,
            } });
        return res.status(201).json({ success: true, data: { ...test, questionCount: 0, attemptCount: 0 } });
    }
    catch (error) {
        next(error);
    }
};
exports.createTest = createTest;
const setTestPublished = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const isPublished = req.body?.isPublished;
        if (typeof isPublished !== 'boolean')
            return res.status(400).json({ success: false, message: 'isPublished must be a boolean.' });
        const result = await (0, transaction_1.serializable)(async (tx) => {
            const test = await tx.test.findUnique({ where: { id }, include: { questions: { include: { options: true } } } });
            if (!test)
                throw Object.assign(new Error('Test not found.'), { status: 404 });
            const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);
            if (isPublished && (!test.questions.length || test.passingMarks > totalMarks ||
                test.questions.some(q => q.marks <= 0 || q.options.length < 2 || q.options.filter(o => o.isCorrect).length !== 1))) {
                throw Object.assign(new Error('Add valid questions and ensure passing marks do not exceed total marks before publishing.'), { status: 400 });
            }
            const updated = await tx.test.update({ where: { id }, data: { isPublished, totalMarks }, include: { _count: { select: { questions: true, attempts: true } } } });
            return { ...updated, questionCount: updated._count.questions, attemptCount: updated._count.attempts };
        });
        return res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.setTestPublished = setTestPublished;
const deleteTest = async (req, res, next) => {
    try {
        const rawId = req.params.id;
        const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
        await (0, transaction_1.serializable)(async (tx) => {
            const test = await tx.test.findUnique({ where: { id }, include: { _count: { select: { attempts: true } } } });
            if (!test)
                throw Object.assign(new Error('Test not found.'), { status: 404 });
            if (test._count.attempts)
                throw Object.assign(new Error('Tests with saved attempts cannot be deleted. Unpublish the test instead.'), { status: 409 });
            await tx.test.delete({ where: { id } });
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

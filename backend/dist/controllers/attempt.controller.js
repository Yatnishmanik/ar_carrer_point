"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttemptById = exports.getUserAttempts = exports.submitAttempt = void 0;
const prisma_1 = require("../lib/prisma");
const grading_1 = require("../utils/grading");
const submitAttempt = async (req, res, next) => {
    try {
        const { testId, answers = [], timeSpentSeconds = 0 } = req.body;
        const userId = req.user.userId;
        if (typeof testId !== 'string' || !Array.isArray(answers) ||
            !Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 ||
            answers.some((a) => !a || typeof a !== 'object' ||
                typeof a.questionId !== 'string' ||
                typeof a.selectedOptionId !== 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Provide testId, valid answers, and non-negative integer timeSpentSeconds',
            });
        }
        // Fetch the test with its questions and correct options
        const test = await prisma_1.prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    include: {
                        options: true,
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
        const seen = new Set();
        for (const answer of answers) {
            const question = test.questions.find(q => q.id === answer.questionId);
            if (seen.has(answer.questionId) || !question || !question.options.some(o => o.id === answer.selectedOptionId)) {
                return res.status(400).json({ success: false, message: 'Duplicate answer or question/option outside this test' });
            }
            seen.add(answer.questionId);
        }
        if (!test.questions.length || timeSpentSeconds > test.durationMinutes * 60) {
            return res.status(400).json({ success: false, message: 'Empty test or invalid test duration' });
        }
        // Format input for grading engine
        const gradingQuestionsInput = test.questions.map((q) => ({
            id: q.id,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            options: q.options.map((o) => ({
                id: o.id,
                isCorrect: o.isCorrect,
            })),
        }));
        // Run grading engine
        const gradingResult = (0, grading_1.gradeAttempt)(gradingQuestionsInput, answers, test.passingMarks > 0 && test.totalMarks > 0
            ? (test.passingMarks / test.totalMarks) * 100
            : 40);
        // Save in Database
        const attempt = await prisma_1.prisma.$transaction(async (tx) => {
            const createdAttempt = await tx.testAttempt.create({
                data: {
                    testId: test.id,
                    userId: userId || null,
                    score: gradingResult.score,
                    maxScore: gradingResult.maxScore,
                    percentage: gradingResult.percentage,
                    passed: gradingResult.passed,
                    correctCount: gradingResult.correctCount,
                    incorrectCount: gradingResult.incorrectCount,
                    unansweredCount: gradingResult.unansweredCount,
                    timeSpentSeconds: Number(timeSpentSeconds),
                    userAnswers: {
                        create: gradingResult.answersGraded.map((ag) => ({
                            questionId: ag.questionId,
                            selectedOptionId: ag.selectedOptionId || null,
                            isCorrect: ag.isCorrect,
                            marksAwarded: ag.marksAwarded,
                        })),
                    },
                },
            });
            return createdAttempt;
        });
        // Format detailed answer review with explanation
        const questionReview = test.questions.map((q) => {
            const graded = gradingResult.answersGraded.find((ag) => ag.questionId === q.id);
            const userSelectedOption = q.options.find((o) => o.id === graded?.selectedOptionId);
            const correctOption = q.options.find((o) => o.isCorrect);
            return {
                questionId: q.id,
                questionText: q.questionText,
                subject: q.subject,
                explanation: q.explanation,
                marks: q.marks,
                negativeMarks: q.negativeMarks,
                options: q.options.map((o) => ({ id: o.id, text: o.text })),
                userSelectedOptionId: userSelectedOption?.id,
                userSelectedText: userSelectedOption?.text,
                correctOptionId: correctOption?.id,
                correctOptionText: correctOption?.text,
                isCorrect: graded?.isCorrect ?? false,
                marksAwarded: graded?.marksAwarded ?? 0,
            };
        });
        return res.status(201).json({
            success: true,
            message: 'टेस्ट सफलतापूर्वक सबमिट हो गया',
            data: {
                attemptId: attempt.id,
                testId: test.id,
                testTitle: test.title,
                categoryName: test.categoryName,
                totalQuestions: test.questions.length,
                score: gradingResult.score,
                maxScore: gradingResult.maxScore,
                percentage: gradingResult.percentage,
                passed: gradingResult.passed,
                correctCount: gradingResult.correctCount,
                incorrectCount: gradingResult.incorrectCount,
                unansweredCount: gradingResult.unansweredCount,
                timeSpentSeconds,
                timestamp: attempt.createdAt,
                questionReview,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitAttempt = submitAttempt;
const getUserAttempts = async (req, res, next) => {
    try {
        const rawUserId = req.params.userId;
        const userId = (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId) || req.user?.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId required',
            });
        }
        if (req.user.role !== 'ADMIN' && userId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'You can only view your own attempts' });
        }
        const attempts = await prisma_1.prisma.testAttempt.findMany({
            where: { userId: String(userId) },
            include: {
                test: {
                    select: {
                        title: true,
                        categoryName: true,
                        durationMinutes: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({
            success: true,
            data: attempts,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserAttempts = getUserAttempts;
const getAttemptById = async (req, res, next) => {
    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const attempt = await prisma_1.prisma.testAttempt.findFirst({
            where: { id: String(id), ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.userId }) },
            include: {
                test: {
                    select: { title: true, categoryName: true },
                },
                userAnswers: {
                    include: {
                        question: {
                            include: {
                                options: true,
                            },
                        },
                        selectedOption: true,
                    },
                },
            },
        });
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Attempt not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: attempt,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAttemptById = getAttemptById;

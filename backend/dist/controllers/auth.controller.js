"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../utils/jwt");
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, targetExam } = req.body;
        if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' ||
            password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 ||
            (phone !== undefined && typeof phone !== 'string') ||
            (targetExam !== undefined && typeof targetExam !== 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Provide a name, valid email, and password of at least 8 characters (maximum 72 UTF-8 bytes).',
            });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'यह ईमेल पहले से पंजीकृत है (Email already registered)',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                targetExam: targetExam || 'Bihar Board Class 10th',
                role: 'STUDENT',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                targetExam: true,
                role: true,
                createdAt: true,
            },
        });
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return res.status(201).json({
            success: true,
            message: 'अकाउंट सफलतापूर्वक बनाया गया (Account registered successfully)',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें',
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'गलत ईमेल या पासवर्ड (Invalid email or password)',
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'गलत ईमेल या पासवर्ड (Invalid email or password)',
            });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return res.status(200).json({
            success: true,
            message: 'सफलतापूर्वक लॉगिन किया गया',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    targetExam: user.targetExam,
                    role: user.role,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthenticated' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                targetExam: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;

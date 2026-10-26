"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ar_career_point?schema=public',
    jwtSecret: process.env.JWT_SECRET || 'ar_career_point_super_secret_jwt_key_2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

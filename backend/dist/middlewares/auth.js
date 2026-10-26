"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'अनधिकृत: कृपया वैध टोकन प्रदान करें (Authorization token required)',
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: 'अमान्य या समाप्त टोकन (Invalid or expired token)',
        });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'निषेध: यह कार्रवाई केवल व्यवस्थापक (Admin) के लिए अनुमत है',
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;

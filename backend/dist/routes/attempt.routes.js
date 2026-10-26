"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attempt_controller_1 = require("../controllers/attempt.controller");
const router = (0, express_1.Router)();
// Test submission (can be authenticated student or guest with userId)
router.post('/', attempt_controller_1.submitAttempt);
router.get('/user/:userId', attempt_controller_1.getUserAttempts);
router.get('/:id', attempt_controller_1.getAttemptById);
exports.default = router;

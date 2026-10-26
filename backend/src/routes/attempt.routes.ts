import { Router } from 'express';
import {
  submitAttempt,
  getUserAttempts,
  getAttemptById,
} from '../controllers/attempt.controller';

const router = Router();

// Test submission (can be authenticated student or guest with userId)
router.post('/', submitAttempt);
router.get('/user/:userId', getUserAttempts);
router.get('/:id', getAttemptById);

export default router;

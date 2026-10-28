import { Router } from 'express';
import {
  addQuestion,
  deleteQuestion,
  getAllQuestions,
} from '../controllers/question.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, requireAdmin, getAllQuestions);
router.post('/', authenticate, requireAdmin, addQuestion);
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);

export default router;

import { Router } from 'express';
import { getExams, createExam } from '../controllers/exam.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', getExams);
router.post('/', authenticate, requireAdmin, createExam);

export default router;

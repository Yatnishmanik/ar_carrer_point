import { Router } from 'express';
import {
  getTests,
  getAdminTests,
  setTestPublished,
  getTestById,
  createTest,
  deleteTest,
} from '../controllers/test.controller';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { getTestScoreboard } from '../controllers/scoreboard.controller';

const router = Router();

router.get('/', getTests);
router.get('/admin', authenticate, requireAdmin, getAdminTests);
router.get('/:id/scoreboard', authenticate, getTestScoreboard);
router.get('/:id', getTestById);
router.patch('/:id', authenticate, requireAdmin, setTestPublished);
router.post('/', authenticate, requireAdmin, createTest);
router.delete('/:id', authenticate, requireAdmin, deleteTest);

export default router;

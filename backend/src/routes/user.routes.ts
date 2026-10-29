import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { listUsers, updateRole } from '../controllers/user.controller';
const router = Router();
router.use(authenticate, requireAdmin);
router.get('/', listUsers);
router.patch('/:id/role', updateRole);
export default router;

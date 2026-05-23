import { Router } from 'express';
import { SourceController } from '../../controllers/source.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Protect all internal source routes with Dashboard auth
router.use(authMiddleware);

router.get('/', SourceController.getSources);

export default router;

import { Router } from 'express';
import { ApiKeyController } from '../../controllers/api-key.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Protect all API Key management routes with Dashboard auth
router.use(authMiddleware);

router.post('/', ApiKeyController.createKey);
router.get('/', ApiKeyController.listKeys);
router.delete('/:keyId', ApiKeyController.deleteKey);

export default router;

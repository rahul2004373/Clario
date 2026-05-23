import { Router } from 'express';
import { SourceController } from '../../controllers/source.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

// Protect all internal source routes with Dashboard auth
router.use(authMiddleware);

router.get('/', SourceController.getSources);
router.post('/', SourceController.createSource);
router.get('/:sourceId/preview', SourceController.getSourcePreview);
router.delete('/:sourceId', SourceController.deleteSource);

export default router;

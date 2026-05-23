import { Router } from 'express';
import { uploadMiddleware } from '../../middleware/upload.middleware';
import { UploadController } from '../../controllers/upload.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/v1/ingest
router.post('/', authMiddleware, uploadMiddleware, UploadController.uploadDocument);

export default router;

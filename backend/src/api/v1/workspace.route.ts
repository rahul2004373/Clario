import { Router } from 'express';
import { WorkspaceController } from '../../controllers/workspace.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all workspace routes
router.use(authMiddleware);

router.post('/', WorkspaceController.createWorkspace);
router.get('/', WorkspaceController.getWorkspaces);
router.get('/:id', WorkspaceController.getWorkspaceById);
router.put('/:id', WorkspaceController.updateWorkspace);
router.delete('/:id', WorkspaceController.deleteWorkspace);

export default router;

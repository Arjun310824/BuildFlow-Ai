import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';

const router = Router();

router.get('/', documentController.getDocuments);
router.post('/', documentController.createDocument);
router.delete('/:id', documentController.deleteDocument);

export default router;

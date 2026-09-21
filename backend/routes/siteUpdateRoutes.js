import { Router } from 'express';
import { siteUpdateController } from '../controllers/siteUpdateController.js';

const router = Router();

router.get('/', siteUpdateController.getSiteUpdates);
router.post('/', siteUpdateController.createSiteUpdate);
router.delete('/:id', siteUpdateController.deleteSiteUpdate);

export default router;

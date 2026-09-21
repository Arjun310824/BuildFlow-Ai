import express from 'express';
import { organizationController } from '../controllers/organizationController.js';

const router = express.Router();

router.get('/', organizationController.getOrganizations);
router.get('/my', organizationController.getMyOrganization);
router.post('/', organizationController.createOrganization);

export default router;

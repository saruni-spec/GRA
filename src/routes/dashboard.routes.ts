import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', dashboardController.getDashboardStats);
router.get('/users', dashboardController.getUserSummaries);

export default router;

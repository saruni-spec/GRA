import express from 'express';
import * as reportsController from '../controllers/reports.controller';

const router = express.Router();

// Get daily summary
router.get('/daily-summary/:userId', reportsController.getDailySummary);

// Get transactions
router.get('/transactions/:userId', reportsController.getTransactions);

export default router;

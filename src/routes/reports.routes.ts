import express from 'express';
import * as reportsController from '../controllers/reports.controller';

const router = express.Router();

// Get daily summary
router.get('/daily-summary/:phoneNumber', reportsController.getDailySummary);

// Get transactions
router.get('/transactions/:phoneNumber', reportsController.getTransactions);

// Get months list
router.get('/months', reportsController.getMonths);

export default router;

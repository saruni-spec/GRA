import express from 'express';
import * as transactionsController from '../controllers/transactions.controller';

const router = express.Router();

// Get transactions summary (aggregated stats)
router.get('/summary', transactionsController.getTransactionsSummary);

// Get all transactions with filtering
router.get('/all', transactionsController.getAllTransactions);

// Get transactions by user phone number
router.get('/user/:phoneNumber', transactionsController.getTransactionsByUser);

export default router;

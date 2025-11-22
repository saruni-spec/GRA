import express from 'express';
import * as workflowController from '../controllers/workflow.controller';

const router = express.Router();

// Process input from Workflow (Text/Audio)
router.post('/process-input', workflowController.processInput);

// Confirm transaction from Workflow
router.post('/confirm-transaction', workflowController.confirmTransaction);

export default router;

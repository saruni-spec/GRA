import { Router } from 'express';
import {
  registerUser,
  checkTinStatus,
  getUserDetails,
  registerTin,
  registerTot,
  getTotStatus,
  getAvailablePeriods,
  calculateTax,
  fileReturn,
  getFilingHistory,
  getReturnDetails
} from '../controllers/tot.controller';

const router = Router();

// POST /api/v1/tot/register-user - Register a new user
router.post('/register-user', registerUser);

// POST /api/v1/tot/check-tin - Check if user has TIN
router.post('/check-tin', checkTinStatus);

// POST /api/v1/tot/get-user-details - Get user details by National ID
router.post('/get-user-details', getUserDetails);

// POST /api/v1/tot/register-tin - Register a new TIN (Branch B)
router.post('/register-tin', registerTin);

// POST /api/v1/tot/register-tot - Register for ToT
router.post('/register-tot', registerTot);

// POST /api/v1/tot/status - Get ToT registration status
router.post('/status', getTotStatus);

// ========================================
// ToT Filing & Payment Routes
// ========================================

// POST /api/v1/tot/available-periods - Get available filing periods
router.post('/available-periods', getAvailablePeriods);

// POST /api/v1/tot/calculate-tax - Calculate tax (3% of gross sales)
router.post('/calculate-tax', calculateTax);

// POST /api/v1/tot/file-return - File a ToT return
router.post('/file-return', fileReturn);

// POST /api/v1/tot/filing-history - Get filing history
router.post('/filing-history', getFilingHistory);

// POST /api/v1/tot/return-details - Get return details by PRN
router.post('/return-details', getReturnDetails);

export default router;

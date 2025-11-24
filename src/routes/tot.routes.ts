import { Router } from 'express';
import {
  checkTinStatus,
  getUserDetails,
  registerTin,
  registerTot,
  getTotStatus
} from '../controllers/tot.controller';

const router = Router();

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

export default router;

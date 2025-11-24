import { Router } from 'express';
import { registerUser, updateUserProfile, getUserProfile, getUserProfileByPhone } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/register - Register a new user
router.post('/register', registerUser);

// GET /api/v1/auth/profile/:userId - Get user profile
router.get('/profile/:userId', getUserProfile);

// GET /api/v1/auth/profile/:phone - Get user profile by phone number
router.get('/profile/phone/:phone', getUserProfileByPhone);

// PATCH /api/v1/auth/profile/:userId - Update user profile (partial updates)
router.patch('/profile/:userId', updateUserProfile);



export default router;

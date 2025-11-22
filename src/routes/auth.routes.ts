import { Router } from 'express';
import { registerUser, updateUserProfile, getUserProfile } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/register - Register a new user
router.post('/register', registerUser);

// GET /api/v1/auth/profile/:userId - Get user profile
router.get('/profile/:userId', getUserProfile);

// PATCH /api/v1/auth/profile/:userId - Update user profile (partial updates)
router.patch('/profile/:userId', updateUserProfile);

export default router;

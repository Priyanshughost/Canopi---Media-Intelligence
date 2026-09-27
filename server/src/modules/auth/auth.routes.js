import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  inviteTeammate,
  getDemoCredentials,
  logout,
} from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/signup', signup);
router.post('/login', login);
router.get('/demo-credentials', getDemoCredentials);
router.post('/logout', logout);

// Authenticated user endpoints
router.get('/me', authenticate, getMe);
router.post('/invite-teammate', authenticate, inviteTeammate);

export default router;

import express from 'express';
import {
  handleOAuthCallback,
  getUserData,
  refreshToken,
  logoutUser,
  getPublicUserProfile // ✅ import the new function
} from '../ctrls/google.js';

const router = express.Router();

router.get('/oauth/callback', handleOAuthCallback);
router.post('/me', getUserData);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);

router.post('/public/:userId', getPublicUserProfile);

export default router;

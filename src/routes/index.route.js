import express from 'express';
import authRoutes from '../modules/auth/auth.route.js';
import adminRoutes from '../modules/admin/admin.route.js';
import coachRoutes from '../modules/coach/coach.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/coach', coachRoutes);

export default router;
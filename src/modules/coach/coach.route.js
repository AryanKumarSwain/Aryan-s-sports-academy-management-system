import express from 'express';
import * as coachController from './coach.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validationErrorHandler } from '../../middlewares/validation.middleware.js';
import { validate } from './coach.validator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('COACH'));

router.get('/dashboard', coachController.getDashboard);
router.get('/batches', coachController.getMyBatches);
router.post('/attendance', validate('markAttendance'), validationErrorHandler, coachController.markAttendance);

export default router;

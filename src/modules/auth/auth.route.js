import express from 'express';
import * as authController from './auth.controller.js';
import { validate } from './auth.validator.js';
import { validationErrorHandler } from '../../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/signup', validate('signup'), validationErrorHandler, authController.signup);
router.post('/login', validate('login'), validationErrorHandler, authController.login);
router.post('/coach/login', validate('login'), validationErrorHandler, authController.coachLogin);

export default router;

import express from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validationErrorHandler } from '../../middlewares/validation.middleware.js';
import { validate } from './admin.validator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'ACADEMY_ADMIN'));

router.get('/sports', adminController.getSportsCatalog);
router.post('/sports', validate('createSport'), validationErrorHandler, adminController.createCustomSport);
router.post('/sports/link', validate('linkSport'), validationErrorHandler, adminController.linkExistingSport);

router.get('/coaches', adminController.getAllCoaches);
router.post('/coaches', validate('createCoach'), validationErrorHandler, adminController.createCoach);
router.put('/coaches/:coach_id', validate('updateCoach'), validationErrorHandler, adminController.updateCoach);
router.delete('/coaches/:coach_id', adminController.deleteCoach);

router.get('/students', adminController.getAllStudents);
router.post('/students', validate('createStudent'), validationErrorHandler, adminController.createStudent);
router.put('/students/:student_id', validate('updateStudent'), validationErrorHandler, adminController.updateStudent);
router.post(
  '/students/:student_id/exit',
  validate('exitStudent'),
  validationErrorHandler,
  adminController.exitStudent
);
router.delete('/students/:student_id', adminController.deleteStudent);

router.get('/batches', adminController.getAllBatches);
router.get('/batches/available', adminController.getAvailableBatches);
router.post('/batches', validate('createBatch'), validationErrorHandler, adminController.createBatch);
router.put('/batches/:batch_id', validate('updateBatch'), validationErrorHandler, adminController.updateBatch);
router.delete('/batches/:batch_id', adminController.deleteBatch);

router.post('/coach-attendance', validate('markAttendance'), validationErrorHandler, adminController.markCoachAttendance);
router.get('/coach-attendance/:coach_id', adminController.getCoachAttendance);

router.get('/payments', adminController.getAllPayments);
router.post('/payments', validate('createPayment'), validationErrorHandler, adminController.createPayment);
router.patch('/payments/:payment_id/status', validate('updatePaymentStatus'), validationErrorHandler, adminController.updatePaymentStatus);

router.get('/analytics', adminController.getAcademyReport);

export default router;

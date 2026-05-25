import * as adminService from './admin.service.js';
import { successResponse } from '../../utils/response.js';

export const getSportsCatalog = async (req, res, next) => {
  try {
    const sports = await adminService.getSportsCatalog(req.user.academy_id);
    res.json(successResponse('Sports catalog retrieved successfully', sports));
  } catch (err) {
    next(err);
  }
};

export const createCustomSport = async (req, res, next) => {
  try {
    const sport = await adminService.createCustomSport(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Custom sport created successfully', sport));
  } catch (err) {
    next(err);
  }
};

export const linkExistingSport = async (req, res, next) => {
  try {
    const sport = await adminService.linkExistingSport(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Sport linked to academy workspace', sport));
  } catch (err) {
    next(err);
  }
};

export const getAllCoaches = async (req, res, next) => {
  try {
    const coaches = await adminService.getAllCoaches(req.user.academy_id);
    res.json(successResponse('Coaches retrieved successfully', coaches));
  } catch (err) {
    next(err);
  }
};

export const createCoach = async (req, res, next) => {
  try {
    const coach = await adminService.createCoach(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Coach created and onboarding email sent', coach));
  } catch (err) {
    next(err);
  }
};

export const updateCoach = async (req, res, next) => {
  try {
    const coach = await adminService.updateCoach(
      req.user.academy_id,
      req.params.coach_id,
      req.body
    );
    res.json(successResponse('Coach updated successfully', coach));
  } catch (err) {
    next(err);
  }
};

export const deleteCoach = async (req, res, next) => {
  try {
    await adminService.deleteCoach(req.user.academy_id, req.params.coach_id);
    res.json(successResponse('Coach archived successfully', {}));
  } catch (err) {
    next(err);
  }
};

export const getAllStudents = async (req, res, next) => {
  try {
    const students = await adminService.getAllStudents(req.user.academy_id);
    res.json(successResponse('Students retrieved successfully', students));
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const student = await adminService.createStudent(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Student created successfully', student));
  } catch (err) {
    next(err);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await adminService.updateStudent(
      req.user.academy_id,
      req.params.student_id,
      req.body
    );
    res.json(successResponse('Student updated successfully', student));
  } catch (err) {
    next(err);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    await adminService.deleteStudent(req.user.academy_id, req.params.student_id);
    res.json(successResponse('Student archived successfully', {}));
  } catch (err) {
    next(err);
  }
};

export const getAllBatches = async (req, res, next) => {
  try {
    const batches = await adminService.getAllBatches(req.user.academy_id);
    res.json(successResponse('Batches retrieved successfully', batches));
  } catch (err) {
    next(err);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const batch = await adminService.createBatch(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Batch created successfully', batch));
  } catch (err) {
    next(err);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const batch = await adminService.updateBatch(
      req.user.academy_id,
      req.params.batch_id,
      req.body
    );
    res.json(successResponse('Batch updated successfully', batch));
  } catch (err) {
    next(err);
  }
};

export const deleteBatch = async (req, res, next) => {
  try {
    await adminService.deleteBatch(req.user.academy_id, req.params.batch_id);
    res.json(successResponse('Batch deleted successfully', {}));
  } catch (err) {
    next(err);
  }
};

export const markCoachAttendance = async (req, res, next) => {
  try {
    const attendance = await adminService.markCoachAttendance(
      req.user.academy_id,
      req.user.user_id,
      req.body
    );
    res.status(201).json(successResponse('Attendance marked successfully', attendance));
  } catch (err) {
    next(err);
  }
};

export const getCoachAttendance = async (req, res, next) => {
  try {
    const attendance = await adminService.getCoachAttendance(
      req.user.academy_id,
      req.params.coach_id
    );
    res.json(successResponse('Attendance retrieved successfully', attendance));
  } catch (err) {
    next(err);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await adminService.getAllPayments(req.user.academy_id);
    res.json(successResponse('Payments retrieved successfully', payments));
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const payment = await adminService.createPayment(req.user.academy_id, req.body);
    res.status(201).json(successResponse('Payment created successfully', payment));
  } catch (err) {
    next(err);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const payment = await adminService.updatePaymentStatus(
      req.user.academy_id,
      req.params.payment_id,
      req.body.status
    );
    res.json(successResponse('Payment updated successfully', payment));
  } catch (err) {
    next(err);
  }
};

export const getAcademyReport = async (req, res, next) => {
  try {
    const report = await adminService.getAcademyReport(req.user.academy_id);
    res.json(successResponse('Academy analytics retrieved successfully', report));
  } catch (err) {
    next(err);
  }
};

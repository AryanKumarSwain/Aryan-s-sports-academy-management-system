import * as coachService from './coach.service.js';
import { successResponse } from '../../utils/response.js';

export const getMyBatches = async (req, res, next) => {
  try {
    const data = await coachService.getCoachBatches(
      req.user.coach_id,
      req.user.academy_id
    );
    res.json(successResponse('Assigned batches retrieved successfully', data));
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const data = await coachService.getCoachDashboard(
      req.user.coach_id,
      req.user.academy_id
    );
    res.json(successResponse('Coach dashboard loaded', data));
  } catch (err) {
    next(err);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    const result = await coachService.markStudentAttendance(
      req.user.coach_id,
      req.user.academy_id,
      req.body
    );
    res.status(201).json(
      successResponse('Attendance recorded and parent notifications sent', result)
    );
  } catch (err) {
    next(err);
  }
};

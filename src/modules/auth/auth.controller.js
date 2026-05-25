import * as authService from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export const signup = async (req, res, next) => {
  try {
    const result = await authService.signupAcademy(req.body);
    return res.status(201).json(
      successResponse('Academy and admin account created successfully', result)
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip
    });

    return res.status(200).json(
      successResponse('Login successful', result)
    );
  } catch (error) {
    next(error);
  }
};

export const coachLogin = async (req, res, next) => {
  try {
    const result = await authService.loginCoach({
      email: req.body.email,
      password: req.body.password,
      ip: req.ip
    });

    return res.status(200).json(
      successResponse('Coach login successful', result)
    );
  } catch (error) {
    next(error);
  }
};

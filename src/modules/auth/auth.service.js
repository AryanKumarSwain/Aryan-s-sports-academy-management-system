import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE, BCRYPT_SALT_ROUNDS } from '../../config/app.config.js';
import { NOT_DELETED } from '../../utils/softDelete.util.js';
import logger from '../../utils/logger.js';

export const signupAcademy = async ({
  name,
  email,
  password,
  academy_name,
  phone_number,
  subscription_plan
}) => {
  const existingUser = await prisma.user.findFirst({
    where: { email, ...NOT_DELETED }
  });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const academy = await tx.academy.create({
        data: {
          name: academy_name,
          owner_name: name,
          email,
          phone_number,
          subscription_plan,
          status: 'active'
        }
      });

      const user = await tx.user.create({
        data: {
          academy_id: academy.academy_id,
          name,
          email,
          password_hash,
          role: 'ADMIN'
        }
      });

      return { academy, user };
    });

    const token = jwt.sign(
      {
        user_id: result.user.user_id,
        email: result.user.email,
        role: result.user.role,
        academy_id: result.user.academy_id,
        name: result.user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    logger.info('Academy signup completed', {
      academy_id: result.academy.academy_id,
      user_id: result.user.user_id,
      email
    });

    return {
      token,
      academy: {
        academy_id: result.academy.academy_id,
        name: result.academy.name,
        subscription_plan: result.academy.subscription_plan
      },
      user: {
        user_id: result.user.user_id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        academy_id: result.user.academy_id
      }
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Academy signup transaction failed', { message: error.message });
    const txError = new Error('Failed to complete academy registration');
    txError.statusCode = 500;
    throw txError;
  }
};

export const loginUser = async ({ email, password, ip }) => {
  logger.info('Admin login attempt', { email, ip });

  const user = await prisma.user.findFirst({
    where: { email, ...NOT_DELETED },
    include: { academy: true }
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.academy && !['active', 'approved'].includes(user.academy.status?.toLowerCase())) {
    const error = new Error('Academy account is not active. Contact support.');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      academy_id: user.academy_id,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  logger.info('Admin login successful', { user_id: user.user_id, email, ip });

  return {
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      academy_id: user.academy_id
    }
  };
};

export const loginCoach = async ({ email, password, ip }) => {
  logger.info('Coach login attempt', { email, ip });

  const coach = await prisma.coach.findFirst({
    where: { email, ...NOT_DELETED },
    include: { academy: true }
  });

  if (!coach || !coach.password_hash) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, coach.password_hash);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      coach_id: coach.coach_id,
      email: coach.email,
      role: 'COACH',
      academy_id: coach.academy_id,
      name: coach.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  logger.info('Coach login successful', { coach_id: coach.coach_id, email, ip });

  return {
    token,
    coach: {
      coach_id: coach.coach_id,
      name: coach.name,
      email: coach.email,
      role: 'COACH',
      academy_id: coach.academy_id
    }
  };
};

import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../../config/app.config.js';
import { NOT_DELETED, softDeletePayload } from '../../utils/softDelete.util.js';
import { generateTempPassword } from '../../utils/password.util.js';
import { sendCoachOnboardingEmail } from '../../services/mail.service.js';
import logger from '../../utils/logger.js';

const academyScope = (academy_id) => ({
  academy_id: parseInt(academy_id, 10),
  ...NOT_DELETED
});

const getCoachForAcademy = async (academy_id, coach_id) =>
  prisma.coach.findFirst({
    where: {
      coach_id: parseInt(coach_id, 10),
      ...academyScope(academy_id)
    }
  });

const getStudentForAcademy = async (academy_id, student_id) =>
  prisma.student.findFirst({
    where: {
      student_id: parseInt(student_id, 10),
      ...academyScope(academy_id)
    }
  });

const getBatchForAcademy = async (academy_id, batch_id) =>
  prisma.batch.findFirst({
    where: {
      batch_id: parseInt(batch_id, 10),
      academy_id: parseInt(academy_id, 10)
    },
    include: { coach: true, sport: true }
  });

const getPaymentForAcademy = async (academy_id, payment_id) =>
  prisma.payment.findFirst({
    where: {
      payment_id: parseInt(payment_id, 10),
      academy_id: parseInt(academy_id, 10),
      student: NOT_DELETED
    },
    include: { student: true }
  });

// ==================== SPORTS ====================

export const getSportsCatalog = async (academy_id) => {
  const academyId = parseInt(academy_id, 10);

  const [globalSports, customSports] = await Promise.all([
    prisma.sport.findMany({
      where: { academy_id: null },
      orderBy: { name: 'asc' }
    }),
    prisma.sport.findMany({
      where: { academy_id: academyId, is_custom: true },
      orderBy: { name: 'asc' }
    })
  ]);

  return {
    global_sports: globalSports,
    academy_sports: customSports,
    available_sports: [...globalSports, ...customSports]
  };
};

export const createCustomSport = async (academy_id, { name }) => {
  const academyId = parseInt(academy_id, 10);

  const existing = await prisma.sport.findFirst({
    where: {
      name,
      OR: [{ academy_id: null }, { academy_id: academyId }]
    }
  });

  if (existing) {
    const error = new Error('Sport already exists in catalog');
    error.statusCode = 409;
    throw error;
  }

  const sport = await prisma.sport.create({
    data: {
      name,
      academy_id: academyId,
      is_custom: true
    }
  });

  logger.info('Custom sport created', { sport_id: sport.sport_id, academy_id: academyId });
  return sport;
};

export const linkExistingSport = async (academy_id, { sport_id }) => {
  const academyId = parseInt(academy_id, 10);
  const sportId = parseInt(sport_id, 10);

  const globalSport = await prisma.sport.findFirst({
    where: { sport_id: sportId, academy_id: null }
  });

  if (!globalSport) {
    const error = new Error('Global sport not found');
    error.statusCode = 404;
    throw error;
  }

  const alreadyLinked = await prisma.sport.findFirst({
    where: {
      name: globalSport.name,
      academy_id: academyId
    }
  });

  if (alreadyLinked) {
    return alreadyLinked;
  }

  const linkedSport = await prisma.sport.create({
    data: {
      name: globalSport.name,
      academy_id: academyId,
      is_custom: false
    }
  });

  logger.info('Sport linked to academy workspace', {
    sport_id: linkedSport.sport_id,
    academy_id: academyId
  });

  return linkedSport;
};

// ==================== COACHES ====================

export const getAllCoaches = async (academy_id) =>
  prisma.coach.findMany({
    where: academyScope(academy_id),
    include: {
      batches: {
        include: { sport: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

export const createCoach = async (academy_id, data) => {
  const academyId = parseInt(academy_id, 10);
  const temporaryPassword = generateTempPassword(8);
  const password_hash = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);

  const existingCoach = await prisma.coach.findFirst({
    where: {
      email: data.email,
      academy_id: academyId,
      ...NOT_DELETED
    }
  });

  if (existingCoach) {
    const error = new Error('Coach email already exists in this academy');
    error.statusCode = 409;
    throw error;
  }

  const coach = await prisma.coach.create({
    data: {
      academy_id: academyId,
      name: data.name,
      specialization: data.specialization,
      phone_number: data.phone_number,
      email: data.email,
      password_hash
    }
  });

  await sendCoachOnboardingEmail({
    email: data.email,
    name: data.name,
    temporaryPassword
  });

  logger.info('Coach provisioned with credentials email', {
    coach_id: coach.coach_id,
    academy_id: academyId
  });

  return {
    coach_id: coach.coach_id,
    name: coach.name,
    email: coach.email,
    specialization: coach.specialization,
    phone_number: coach.phone_number,
    credentials_sent: true
  };
};

export const updateCoach = async (academy_id, coach_id, data) => {
  const coach = await getCoachForAcademy(academy_id, coach_id);

  if (!coach) {
    const error = new Error('Coach not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.coach.update({
    where: { coach_id: coach.coach_id },
    data: {
      name: data.name ?? coach.name,
      specialization: data.specialization ?? coach.specialization,
      phone_number: data.phone_number ?? coach.phone_number,
      email: data.email ?? coach.email
    }
  });
};

export const deleteCoach = async (academy_id, coach_id) => {
  const coach = await getCoachForAcademy(academy_id, coach_id);

  if (!coach) {
    const error = new Error('Coach not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.coach.update({
    where: { coach_id: coach.coach_id },
    data: softDeletePayload()
  });

  logger.info('Coach soft-deleted', { coach_id, academy_id });
};

// ==================== STUDENTS ====================

export const getAllStudents = async (academy_id) =>
  prisma.student.findMany({
    where: academyScope(academy_id),
    include: {
      batch: true,
      sport: true,
      payments: {
        orderBy: { payment_date: 'desc' },
        take: 5
      }
    },
    orderBy: { created_at: 'desc' }
  });

export const createStudent = async (academy_id, data) => {
  const student = await prisma.student.create({
    data: {
      academy_id: parseInt(academy_id, 10),
      name: data.name,
      age: data.age,
      gender: data.gender,
      sport_id: data.sport_id ? parseInt(data.sport_id, 10) : null,
      batch_id: data.batch_id ? parseInt(data.batch_id, 10) : null,
      blood_group: data.blood_group,
      parent_email: data.parent_email,
      fees_status: data.fees_status || 'unpaid'
    },
    include: { batch: true, sport: true }
  });

  logger.info('Student created', { student_id: student.student_id, academy_id });
  return student;
};

export const updateStudent = async (academy_id, student_id, data) => {
  const student = await getStudentForAcademy(academy_id, student_id);

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.student.update({
    where: { student_id: student.student_id },
    data: {
      name: data.name ?? student.name,
      age: data.age ?? student.age,
      gender: data.gender ?? student.gender,
      sport_id: data.sport_id !== undefined ? parseInt(data.sport_id, 10) : student.sport_id,
      batch_id: data.batch_id !== undefined ? parseInt(data.batch_id, 10) : student.batch_id,
      blood_group: data.blood_group ?? student.blood_group,
      parent_email: data.parent_email ?? student.parent_email,
      fees_status: data.fees_status ?? student.fees_status
    },
    include: { batch: true, sport: true, payments: true }
  });
};

export const deleteStudent = async (academy_id, student_id) => {
  const student = await getStudentForAcademy(academy_id, student_id);

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.student.update({
    where: { student_id: student.student_id },
    data: softDeletePayload()
  });

  logger.info('Student soft-deleted', { student_id, academy_id });
};

// ==================== BATCHES ====================

export const getAllBatches = async (academy_id) => {
  const batches = await prisma.batch.findMany({
    where: { academy_id: parseInt(academy_id, 10) },
    include: {
      coach: true,
      sport: true,
      students: { where: NOT_DELETED }
    },
    orderBy: { batch_id: 'desc' }
  });

  return batches.map((batch) => ({
    ...batch,
    coach: batch.coach && batch.coach.is_deleted ? null : batch.coach
  }));
};

export const createBatch = async (academy_id, data) => {
  const academyId = parseInt(academy_id, 10);

  if (data.coach_id) {
    const coach = await getCoachForAcademy(academyId, data.coach_id);
    if (!coach) {
      const error = new Error('Coach not found in academy workspace');
      error.statusCode = 404;
      throw error;
    }
  }

  const batch = await prisma.batch.create({
    data: {
      academy_id: academyId,
      name: data.name,
      coach_id: data.coach_id ? parseInt(data.coach_id, 10) : null,
      sport_id: data.sport_id ? parseInt(data.sport_id, 10) : null,
      timing: data.timing
    },
    include: { coach: true, sport: true }
  });

  logger.info('Batch created', { batch_id: batch.batch_id, academy_id: academyId });
  return batch;
};

export const updateBatch = async (academy_id, batch_id, data) => {
  const batch = await getBatchForAcademy(academy_id, batch_id);

  if (!batch) {
    const error = new Error('Batch not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.batch.update({
    where: { batch_id: batch.batch_id },
    data: {
      name: data.name ?? batch.name,
      coach_id: data.coach_id !== undefined ? parseInt(data.coach_id, 10) : batch.coach_id,
      sport_id: data.sport_id !== undefined ? parseInt(data.sport_id, 10) : batch.sport_id,
      timing: data.timing ?? batch.timing
    },
    include: { coach: true, sport: true }
  });
};

export const deleteBatch = async (academy_id, batch_id) => {
  const batch = await getBatchForAcademy(academy_id, batch_id);

  if (!batch) {
    const error = new Error('Batch not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.batch.delete({
    where: { batch_id: batch.batch_id }
  });

  logger.info('Batch deleted', { batch_id, academy_id });
};

// ==================== COACH ATTENDANCE ====================

export const markCoachAttendance = async (academy_id, marked_by_admin_id, data) => {
  const coach = await getCoachForAcademy(academy_id, data.coach_id);

  if (!coach) {
    const error = new Error('Coach not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.coachAttendance.create({
    data: {
      academy_id: parseInt(academy_id, 10),
      coach_id: coach.coach_id,
      date: new Date(data.date),
      status: data.status,
      marked_by_admin_id,
      remarks: data.remarks || null
    }
  });
};

export const getCoachAttendance = async (academy_id, coach_id) => {
  const coach = await getCoachForAcademy(academy_id, coach_id);

  if (!coach) {
    const error = new Error('Coach not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.coachAttendance.findMany({
    where: {
      coach_id: coach.coach_id,
      academy_id: parseInt(academy_id, 10)
    },
    orderBy: { date: 'desc' }
  });
};

// ==================== PAYMENTS ====================

export const getAllPayments = async (academy_id) =>
  prisma.payment.findMany({
    where: {
      academy_id: parseInt(academy_id, 10),
      student: NOT_DELETED
    },
    include: { student: true },
    orderBy: { payment_date: 'desc' }
  });

export const createPayment = async (academy_id, data) => {
  const student = await getStudentForAcademy(academy_id, data.student_id);

  if (!student) {
    const error = new Error('Student not found in this academy workspace');
    error.statusCode = 404;
    throw error;
  }

  const payment = await prisma.payment.create({
    data: {
      academy_id: parseInt(academy_id, 10),
      student_id: student.student_id,
      amount: data.amount,
      payment_date: new Date(data.payment_date),
      method: data.method || null,
      status: data.status || 'pending'
    }
  });

  if (data.status === 'completed' || data.status === 'paid') {
    await prisma.student.update({
      where: { student_id: student.student_id },
      data: { fees_status: 'paid' }
    });
  }

  return payment;
};

export const updatePaymentStatus = async (academy_id, payment_id, status) => {
  const payment = await getPaymentForAcademy(academy_id, payment_id);

  if (!payment) {
    const error = new Error('Payment record not found in this workspace');
    error.statusCode = 404;
    throw error;
  }

  const updatedPayment = await prisma.payment.update({
    where: { payment_id: payment.payment_id },
    data: { status }
  });

  if (status === 'completed') {
    await prisma.student.update({
      where: { student_id: payment.student_id },
      data: { fees_status: 'paid' }
    });
  }

  return updatedPayment;
};

// ==================== ANALYTICS ====================

export const getAcademyReport = async (academy_id) => {
  const academyId = parseInt(academy_id, 10);
  const activeStudentFilter = { academy_id: academyId, ...NOT_DELETED };
  const activeCoachFilter = { academy_id: academyId, ...NOT_DELETED };

  const [
    activeCoaches,
    activeStudents,
    totalBatches,
    revenueAggregate,
    paidStudents,
    unpaidStudents
  ] = await Promise.all([
    prisma.coach.count({ where: activeCoachFilter }),
    prisma.student.count({ where: activeStudentFilter }),
    prisma.batch.count({ where: { academy_id: academyId } }),
    prisma.payment.aggregate({
      where: {
        academy_id: academyId,
        status: 'completed',
        student: NOT_DELETED
      },
      _sum: { amount: true }
    }),
    prisma.student.count({
      where: { ...activeStudentFilter, fees_status: 'paid' }
    }),
    prisma.student.count({
      where: {
        ...activeStudentFilter,
        fees_status: { in: ['unpaid', 'pending', 'partial'] }
      }
    })
  ]);

  return {
    active_coach_count: activeCoaches,
    active_student_count: activeStudents,
    total_batches: totalBatches,
    total_revenue: revenueAggregate._sum.amount || 0,
    payment_summary: {
      paid_students: paidStudents,
      unpaid_students: unpaidStudents
    }
  };
};

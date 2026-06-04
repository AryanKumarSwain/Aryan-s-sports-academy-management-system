import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../../config/app.config.js';
import { NOT_DELETED, softDeletePayload } from '../../utils/softDelete.util.js';
import { generateTempPassword } from '../../utils/password.util.js';
import { sendCoachOnboardingEmail, sendStudentExitEmail } from '../../services/mail.service.js';
import { logAudit } from '../../utils/audit.util.js';
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

const assertStudentSportBatch = async (academy_id, sport_id, batch_id) => {
  const sportId = parseInt(sport_id, 10);
  const batchId = parseInt(batch_id, 10);
  const batch = await getBatchForAcademy(academy_id, batchId);

  if (!batch) {
    const error = new Error('Batch not found');
    error.statusCode = 404;
    throw error;
  }

  if (batch.status !== 'ACTIVE') {
    const error = new Error('Batch is not active');
    error.statusCode = 400;
    throw error;
  }

  if (batch.sport_id !== sportId) {
    const error = new Error('Batch does not match selected sport');
    error.statusCode = 400;
    throw error;
  }

  if (batch.max_capacity != null) {
    const enrolled = await prisma.student.count({
      where: { batch_id: batchId, ...NOT_DELETED, status: 'ACTIVE' }
    });
    if (enrolled >= batch.max_capacity) {
      const error = new Error('Batch has no available seats');
      error.statusCode = 400;
      throw error;
    }
  }

  return batch;
};

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
  const email = data.email.trim();
  const temporaryPassword = generateTempPassword(8);
  const password_hash = await bcrypt.hash(temporaryPassword, BCRYPT_SALT_ROUNDS);

  const existingCoach = await prisma.coach.findFirst({
    where: {
      email,
      academy_id: academyId,
      ...NOT_DELETED
    }
  });

  if (existingCoach) {
    const error = new Error('Coach email already exists in this academy');
    error.statusCode = 409;
    throw error;
  }

  const deletedCoach = await prisma.coach.findFirst({
    where: {
      email,
      academy_id: academyId,
      is_deleted: true
    }
  });

  if (deletedCoach) {
    const error = new Error(
      'A coach with this email was previously removed. Restore or use a different email.'
    );
    error.statusCode = 409;
    throw error;
  }

  const coach = await prisma.coach.create({
    data: {
      academy_id: academyId,
      name: data.name,
      specialization: data.specialization,
      phone_number: data.phone_number,
      email,
      password_hash
    }
  });

  let credentials_sent = false;

  try {
    await sendCoachOnboardingEmail({
      email,
      name: data.name,
      temporaryPassword
    });
    credentials_sent = true;
    logger.info('Coach provisioned with credentials email', {
      coach_id: coach.coach_id,
      academy_id: academyId,
      email
    });
  } catch (mailError) {
    logger.error('Coach created but onboarding email failed', {
      coach_id: coach.coach_id,
      academy_id: academyId,
      email,
      smtp_code: mailError.code,
      message: mailError.message
    });
    const error = new Error(
      'Coach account was created but the credentials email could not be sent. Check SMTP settings and try resending credentials.'
    );
    error.statusCode = 502;
    error.coach_id = coach.coach_id;
    throw error;
  }

  return {
    coach_id: coach.coach_id,
    name: coach.name,
    email: coach.email,
    specialization: coach.specialization,
    phone_number: coach.phone_number,
    credentials_sent
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
  if (data.sport_id && data.batch_id) {
    await assertStudentSportBatch(academy_id, data.sport_id, data.batch_id);
  }

  const student = await prisma.student.create({
    data: {
      academy_id: parseInt(academy_id, 10),
      name: data.name,
      age: data.age,
      gender: data.gender,
      sport_id: data.sport_id ? parseInt(data.sport_id, 10) : null,
      batch_id: data.batch_id ? parseInt(data.batch_id, 10) : null,
      blood_group: data.blood_group,
      parent_name: data.parent_name || null,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone || null,
      fees_status: data.fees_status || 'unpaid',
      status: 'ACTIVE'
    },
    include: { batch: true, sport: true }
  });

  await logAudit({
    academy_id,
    actor_type: 'ADMIN',
    action: 'STUDENT_CREATED',
    entity_type: 'Student',
    entity_id: student.student_id
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

  const nextSportId =
    data.sport_id !== undefined ? parseInt(data.sport_id, 10) : student.sport_id;
  const nextBatchId =
    data.batch_id !== undefined ? parseInt(data.batch_id, 10) : student.batch_id;

  if (nextSportId && nextBatchId) {
    await assertStudentSportBatch(academy_id, nextSportId, nextBatchId);
  }

  return prisma.student.update({
    where: { student_id: student.student_id },
    data: {
      name: data.name ?? student.name,
      age: data.age ?? student.age,
      gender: data.gender ?? student.gender,
      sport_id: nextSportId,
      batch_id: nextBatchId,
      blood_group: data.blood_group ?? student.blood_group,
      parent_name: data.parent_name ?? student.parent_name,
      parent_email: data.parent_email ?? student.parent_email,
      parent_phone: data.parent_phone ?? student.parent_phone,
      fees_status: data.fees_status ?? student.fees_status
    },
    include: { batch: true, sport: true, payments: true }
  });
};

export const exitStudent = async (academy_id, student_id, data, admin_user_id) => {
  const student = await getStudentForAcademy(academy_id, student_id);

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.student.update({
    where: { student_id: student.student_id },
    data: {
      status: 'INACTIVE',
      exit_reason: data.exit_reason,
      exit_note: data.exit_note || null,
      batch_id: null,
      ...softDeletePayload()
    }
  });

  if (student.parent_email) {
    try {
      await sendStudentExitEmail({
        parentEmail: student.parent_email,
        studentName: student.name,
        exitReason: data.exit_reason,
        exitNote: data.exit_note
      });
    } catch (mailErr) {
      logger.error('Student exit email failed', {
        student_id: student.student_id,
        message: mailErr.message
      });
    }
  }

  await logAudit({
    academy_id,
    actor_type: 'ADMIN',
    actor_id: admin_user_id,
    action: 'STUDENT_EXIT',
    entity_type: 'Student',
    entity_id: student.student_id,
    metadata: { exit_reason: data.exit_reason }
  });

  return updated;
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
      students: { where: { ...NOT_DELETED, status: 'ACTIVE' } }
    },
    orderBy: { batch_id: 'desc' }
  });

  return batches.map((batch) => ({
    ...batch,
    coach: batch.coach && batch.coach.is_deleted ? null : batch.coach,
    enrolled_count: batch.students.length,
    available_seats:
      batch.max_capacity != null
        ? Math.max(0, batch.max_capacity - batch.students.length)
        : null
  }));
};

export const getAvailableBatches = async (academy_id, sport_id) => {
  const sportId = parseInt(sport_id, 10);
  const batches = await getAllBatches(academy_id);

  return batches.filter(
    (batch) =>
      batch.status === 'ACTIVE' &&
      batch.sport_id === sportId &&
      (batch.max_capacity == null || batch.students.length < batch.max_capacity)
  );
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
      timing: data.timing,
      max_capacity: data.max_capacity ? parseInt(data.max_capacity, 10) : null,
      status: data.status || 'ACTIVE'
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
      timing: data.timing ?? batch.timing,
      max_capacity:
        data.max_capacity !== undefined
          ? parseInt(data.max_capacity, 10)
          : batch.max_capacity,
      status: data.status ?? batch.status
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

  const enrolled = await prisma.student.count({
    where: { batch_id: batch.batch_id, ...NOT_DELETED, status: 'ACTIVE' }
  });

  if (enrolled > 0) {
    const error = new Error('Cannot delete batch with enrolled students. Reassign students first.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.batch.update({
    where: { batch_id: batch.batch_id },
    data: { status: 'INACTIVE' }
  });

  logger.info('Batch deactivated', { batch_id, academy_id });
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

  if (data.status === 'completed') {
    await prisma.student.update({
      where: { student_id: student.student_id },
      data: { fees_status: 'paid' }
    });
  }

  await logAudit({
    academy_id,
    actor_type: 'ADMIN',
    action: 'PAYMENT_CREATED',
    entity_type: 'Payment',
    entity_id: payment.payment_id
  });

  return payment;
};

export const updatePaymentStatus = async (
  academy_id,
  payment_id,
  { status, rejected_reason },
  admin_user_id
) => {
  const payment = await getPaymentForAcademy(academy_id, payment_id);

  if (!payment) {
    const error = new Error('Payment record not found in this workspace');
    error.statusCode = 404;
    throw error;
  }

  const updatedPayment = await prisma.payment.update({
    where: { payment_id: payment.payment_id },
    data: {
      status,
      approved_by_user_id: status === 'completed' ? admin_user_id : payment.approved_by_user_id,
      rejected_reason: status === 'rejected' ? rejected_reason || null : null
    }
  });

  if (status === 'completed') {
    await prisma.student.update({
      where: { student_id: payment.student_id },
      data: { fees_status: 'paid' }
    });
  } else if (status === 'rejected') {
    await prisma.student.update({
      where: { student_id: payment.student_id },
      data: { fees_status: 'unpaid' }
    });
  }

  await logAudit({
    academy_id,
    actor_type: 'ADMIN',
    actor_id: admin_user_id,
    action: 'PAYMENT_STATUS_UPDATED',
    entity_type: 'Payment',
    entity_id: payment.payment_id,
    metadata: { status }
  });

  return updatedPayment;
};

// ==================== ANALYTICS ====================

export const getAcademyReport = async (academy_id) => {
  const academyId = parseInt(academy_id, 10);
  const activeStudentFilter = { academy_id: academyId, ...NOT_DELETED };
  const activeCoachFilter = { academy_id: academyId, ...NOT_DELETED };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeCoaches,
    activeStudents,
    totalBatches,
    revenueAggregate,
    paidStudents,
    unpaidStudents,
    attendanceAgg
  ] = await Promise.all([
    prisma.coach.count({ where: activeCoachFilter }),
    prisma.student.count({ where: { ...activeStudentFilter, status: 'ACTIVE' } }),
    prisma.batch.count({ where: { academy_id: academyId, status: 'ACTIVE' } }),
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
    }),
    prisma.studentAttendance.groupBy({
      by: ['status'],
      where: {
        academy_id: academyId,
        date: { gte: thirtyDaysAgo }
      },
      _count: { status: true }
    })
  ]);

  const attendanceCounts = attendanceAgg.reduce(
    (acc, row) => {
      acc[row.status] = row._count.status;
      acc.total += row._count.status;
      return acc;
    },
    { total: 0 }
  );

  const presentCount =
    (attendanceCounts.PRESENT || 0) + (attendanceCounts.LATE || 0);
  const attendancePercent =
    attendanceCounts.total > 0
      ? Math.round((presentCount / attendanceCounts.total) * 100)
      : 0;

  return {
    active_coach_count: activeCoaches,
    active_student_count: activeStudents,
    total_batches: totalBatches,
    total_revenue: revenueAggregate._sum.amount || 0,
    attendance_percent: attendancePercent,
    payment_summary: {
      paid_students: paidStudents,
      unpaid_students: unpaidStudents
    }
  };
};

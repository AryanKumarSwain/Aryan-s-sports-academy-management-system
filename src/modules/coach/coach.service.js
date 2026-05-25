import prisma from '../../config/prisma.js';
import { NOT_DELETED } from '../../utils/softDelete.util.js';
import { sendParentAttendanceEmail } from '../../services/mail.service.js';
import logger from '../../utils/logger.js';

const VALID_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT'];

export const getCoachBatches = async (coach_id, academy_id) =>
  prisma.batch.findMany({
    where: {
      coach_id: parseInt(coach_id, 10),
      academy_id: parseInt(academy_id, 10)
    },
    include: {
      sport: true,
      students: { where: NOT_DELETED }
    }
  });

export const markStudentAttendance = async (coach_id, academy_id, payload) => {
  const coachId = parseInt(coach_id, 10);
  const academyId = parseInt(academy_id, 10);
  const batchId = parseInt(payload.batch_id, 10);
  const attendanceDate = payload.date ? new Date(payload.date) : new Date();
  const records = payload.records || [];

  if (!Array.isArray(records) || records.length === 0) {
    const error = new Error('At least one attendance record is required');
    error.statusCode = 400;
    throw error;
  }

  const batch = await prisma.batch.findFirst({
    where: {
      batch_id: batchId,
      academy_id: academyId,
      coach_id: coachId
    },
    include: { sport: true }
  });

  if (!batch) {
    const error = new Error('Batch not found or not assigned to this coach');
    error.statusCode = 404;
    throw error;
  }

  const results = [];
  const emailDispatches = [];

  for (const record of records) {
    const status = String(record.status || '').toUpperCase();

    if (!VALID_ATTENDANCE_STATUSES.includes(status)) {
      const error = new Error(`Invalid attendance status for student ${record.student_id}`);
      error.statusCode = 400;
      throw error;
    }

    const student = await prisma.student.findFirst({
      where: {
        student_id: parseInt(record.student_id, 10),
        academy_id: academyId,
        batch_id: batchId,
        ...NOT_DELETED
      }
    });

    if (!student) {
      const error = new Error(`Student ${record.student_id} not found in assigned batch`);
      error.statusCode = 404;
      throw error;
    }

    const attendance = await prisma.studentAttendance.create({
      data: {
        academy_id: academyId,
        student_id: student.student_id,
        batch_id: batchId,
        date: attendanceDate,
        status,
        marked_by_coach_id: coachId,
        remarks: record.remarks || null
      }
    });

    results.push(attendance);

    if (student.parent_email) {
      emailDispatches.push(
        sendParentAttendanceEmail({
          parentEmail: student.parent_email,
          studentName: student.name,
          status,
          batchName: batch.name,
          remarks: record.remarks || null,
          markedAt: new Date()
        })
      );
    } else {
      logger.warn('Parent email missing; attendance email skipped', {
        student_id: student.student_id
      });
    }
  }

  await Promise.all(emailDispatches);

  logger.info('Student attendance marked and parent notifications dispatched', {
    coach_id: coachId,
    batch_id: batchId,
    records_count: results.length
  });

  return {
    batch_id: batchId,
    date: attendanceDate,
    marked_count: results.length,
    attendance_records: results
  };
};

import { z } from 'zod';

export const sportCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  base_fee: z.coerce.number().min(0).default(0)
});

export const sportUpdateSchema = sportCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const planCreateSchema = z.object({
  name: z.string().min(1).max(50),
  duration_months: z.coerce.number().int().min(1).max(24),
  multiplier: z.coerce.number().min(0.1).max(10).default(1)
});

export const planUpdateSchema = planCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const batchCreateSchema = z.object({
  name: z.string().min(2).max(100),
  sport_id: z.coerce.number().int().positive(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  max_capacity: z.coerce.number().int().min(1).max(500),
  coach_ids: z.array(z.coerce.number().int()).optional()
});

export const batchUpdateSchema = batchCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const coachCreateSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().optional(),
  specialization: z.string().optional()
});

export const coachUpdateSchema = coachCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const studentCreateSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().email().optional(),
  sport_id: z.coerce.number().int().positive(),
  batch_id: z.coerce.number().int().positive().optional(),
  duration_plan_id: z.coerce.number().int().positive(),
  registration_fee: z.coerce.number().min(0).optional(),
  additional_charges: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional()
});

export const studentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  middle_name: z.string().optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().email().optional(),
  batch_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const receiptCreateSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  discount: z.coerce.number().min(0).default(0),
  additional_charges: z.coerce.number().min(0).default(0),
  payment_date: z.coerce.date().optional(),
  method: z.enum(['CASH', 'ONLINE', 'BANK_TRANSFER', 'UPI', 'CHEQUE']).default('CASH'),
  remarks: z.string().max(500).optional()
});

export const coachAttendanceSchema = z.object({
  date: z.coerce.date(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  remarks: z.string().max(500).optional()
});

export const studentAttendanceBulkSchema = z.object({
  batch_id: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  records: z.array(
    z.object({
      student_id: z.coerce.number().int().positive(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY'])
    })
  ).min(1)
});

export const attributeRequestSchema = z.object({
  sport_id: z.coerce.number().int().positive(),
  name: z.string().min(2).max(100)
});

export const performanceRecordSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  attribute_id: z.coerce.number().int().positive(),
  score: z.coerce.number().int().min(1).max(10),
  notes: z.string().max(500).optional()
});

export const settingsUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  owner_name: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  logo_url: z.string().url().optional(),
  registration_fee_default: z.coerce.number().min(0).optional(),
  attendance_radius_meters: z.coerce.number().int().min(50).max(500).optional(),
  receipt_template: z.string().optional()
});

export const feePreviewSchema = z.object({
  sport_ids: z.array(z.coerce.number().int().positive()).min(1),
  duration_plan_id: z.coerce.number().int().positive(),
  registration_fee: z.coerce.number().min(0).optional(),
  additional_charges: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional()
});


Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SuperAdminScalarFieldEnum = {
  super_admin_id: 'super_admin_id',
  name: 'name',
  email: 'email',
  password_hash: 'password_hash',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PlatformPlanScalarFieldEnum = {
  plan_id: 'plan_id',
  tier: 'tier',
  name: 'name',
  max_coaches: 'max_coaches',
  max_students: 'max_students',
  price_monthly: 'price_monthly',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.AcademyScalarFieldEnum = {
  academy_id: 'academy_id',
  name: 'name',
  owner_name: 'owner_name',
  email: 'email',
  phone_number: 'phone_number',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  pincode: 'pincode',
  latitude: 'latitude',
  longitude: 'longitude',
  logo_url: 'logo_url',
  subscription_tier: 'subscription_tier',
  subscription_plan: 'subscription_plan',
  subscription_starts_at: 'subscription_starts_at',
  subscription_expires_at: 'subscription_expires_at',
  status: 'status',
  registration_fee_default: 'registration_fee_default',
  attendance_radius_meters: 'attendance_radius_meters',
  receipt_template: 'receipt_template',
  notification_prefs: 'notification_prefs',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.UserScalarFieldEnum = {
  user_id: 'user_id',
  academy_id: 'academy_id',
  name: 'name',
  first_name: 'first_name',
  middle_name: 'middle_name',
  last_name: 'last_name',
  email: 'email',
  password_hash: 'password_hash',
  role: 'role',
  is_deleted: 'is_deleted',
  deleted_at: 'deleted_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CoachScalarFieldEnum = {
  coach_id: 'coach_id',
  academy_id: 'academy_id',
  name: 'name',
  first_name: 'first_name',
  middle_name: 'middle_name',
  last_name: 'last_name',
  specialization: 'specialization',
  phone_number: 'phone_number',
  email: 'email',
  password_hash: 'password_hash',
  status: 'status',
  is_deleted: 'is_deleted',
  deleted_at: 'deleted_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SportScalarFieldEnum = {
  sport_id: 'sport_id',
  name: 'name',
  description: 'description',
  base_fee: 'base_fee',
  status: 'status',
  academy_id: 'academy_id',
  is_custom: 'is_custom',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DurationPlanScalarFieldEnum = {
  plan_id: 'plan_id',
  academy_id: 'academy_id',
  name: 'name',
  duration_months: 'duration_months',
  multiplier: 'multiplier',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BatchScalarFieldEnum = {
  batch_id: 'batch_id',
  academy_id: 'academy_id',
  name: 'name',
  sport_id: 'sport_id',
  timing: 'timing',
  start_time: 'start_time',
  end_time: 'end_time',
  max_capacity: 'max_capacity',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BatchCoachScalarFieldEnum = {
  batch_coach_id: 'batch_coach_id',
  batch_id: 'batch_id',
  coach_id: 'coach_id',
  created_at: 'created_at'
};

exports.Prisma.StudentScalarFieldEnum = {
  student_id: 'student_id',
  academy_id: 'academy_id',
  name: 'name',
  first_name: 'first_name',
  middle_name: 'middle_name',
  last_name: 'last_name',
  phone: 'phone',
  parent_name: 'parent_name',
  parent_phone: 'parent_phone',
  parent_email: 'parent_email',
  joining_date: 'joining_date',
  age: 'age',
  gender: 'gender',
  sport_id: 'sport_id',
  batch_id: 'batch_id',
  blood_group: 'blood_group',
  fees_status: 'fees_status',
  status: 'status',
  exit_reason: 'exit_reason',
  exit_note: 'exit_note',
  is_deleted: 'is_deleted',
  deleted_at: 'deleted_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.StudentEnrollmentScalarFieldEnum = {
  enrollment_id: 'enrollment_id',
  academy_id: 'academy_id',
  student_id: 'student_id',
  sport_id: 'sport_id',
  duration_plan_id: 'duration_plan_id',
  batch_id: 'batch_id',
  coach_id: 'coach_id',
  registration_fee: 'registration_fee',
  sports_fee: 'sports_fee',
  additional_charges: 'additional_charges',
  discount: 'discount',
  final_fee: 'final_fee',
  paid_amount: 'paid_amount',
  next_due_date: 'next_due_date',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ReceiptScalarFieldEnum = {
  receipt_id: 'receipt_id',
  receipt_number: 'receipt_number',
  academy_id: 'academy_id',
  student_id: 'student_id',
  amount: 'amount',
  discount: 'discount',
  additional_charges: 'additional_charges',
  payment_date: 'payment_date',
  method: 'method',
  status: 'status',
  proof_url: 'proof_url',
  remarks: 'remarks',
  rejected_reason: 'rejected_reason',
  approved_by_user_id: 'approved_by_user_id',
  collected_by_coach_id: 'collected_by_coach_id',
  pdf_url: 'pdf_url',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.StudentAttendanceScalarFieldEnum = {
  attendance_id: 'attendance_id',
  academy_id: 'academy_id',
  student_id: 'student_id',
  batch_id: 'batch_id',
  date: 'date',
  status: 'status',
  marked_by_coach_id: 'marked_by_coach_id',
  remarks: 'remarks',
  latitude: 'latitude',
  longitude: 'longitude',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CoachAttendanceScalarFieldEnum = {
  attendance_id: 'attendance_id',
  coach_id: 'coach_id',
  academy_id: 'academy_id',
  date: 'date',
  status: 'status',
  marked_by_admin_id: 'marked_by_admin_id',
  latitude: 'latitude',
  longitude: 'longitude',
  remarks: 'remarks',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PerformanceAttributeScalarFieldEnum = {
  attribute_id: 'attribute_id',
  academy_id: 'academy_id',
  sport_id: 'sport_id',
  name: 'name',
  status: 'status',
  requested_by_coach_id: 'requested_by_coach_id',
  reviewed_at: 'reviewed_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PerformanceScoreScalarFieldEnum = {
  score_id: 'score_id',
  academy_id: 'academy_id',
  student_id: 'student_id',
  attribute_id: 'attribute_id',
  coach_id: 'coach_id',
  score: 'score',
  notes: 'notes',
  scored_at: 'scored_at',
  created_at: 'created_at'
};

exports.Prisma.NotificationScalarFieldEnum = {
  notification_id: 'notification_id',
  academy_id: 'academy_id',
  user_id: 'user_id',
  coach_id: 'coach_id',
  type: 'type',
  title: 'title',
  body: 'body',
  is_read: 'is_read',
  metadata: 'metadata',
  created_at: 'created_at'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  audit_id: 'audit_id',
  academy_id: 'academy_id',
  actor_type: 'actor_type',
  actor_id: 'actor_id',
  action: 'action',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  metadata: 'metadata',
  ip_address: 'ip_address',
  created_at: 'created_at'
};

exports.Prisma.PasswordResetScalarFieldEnum = {
  reset_id: 'reset_id',
  email: 'email',
  code_hash: 'code_hash',
  account_type: 'account_type',
  expires_at: 'expires_at',
  created_at: 'created_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.SubscriptionTier = exports.$Enums.SubscriptionTier = {
  FREE: 'FREE',
  PRO: 'PRO',
  PLUS: 'PLUS'
};

exports.AcademyStatus = exports.$Enums.AcademyStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED'
};

exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ACADEMY_ADMIN: 'ACADEMY_ADMIN',
  COACH: 'COACH'
};

exports.RecordStatus = exports.$Enums.RecordStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

exports.ReceiptStatus = exports.$Enums.ReceiptStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  VOID: 'VOID'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE: 'LEAVE',
  HALF_DAY: 'HALF_DAY'
};

exports.CoachAttendanceStatus = exports.$Enums.CoachAttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE'
};

exports.AttributeRequestStatus = exports.$Enums.AttributeRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  DUE_FEE: 'DUE_FEE',
  OVERDUE_FEE: 'OVERDUE_FEE',
  COACH_ABSENT: 'COACH_ABSENT',
  SUBSCRIPTION_EXPIRY: 'SUBSCRIPTION_EXPIRY',
  NEW_STUDENT: 'NEW_STUDENT',
  ATTENDANCE_REMINDER: 'ATTENDANCE_REMINDER',
  PERFORMANCE_REMINDER: 'PERFORMANCE_REMINDER',
  ATTRIBUTE_REQUEST: 'ATTRIBUTE_REQUEST',
  GENERAL: 'GENERAL'
};

exports.Prisma.ModelName = {
  SuperAdmin: 'SuperAdmin',
  PlatformPlan: 'PlatformPlan',
  Academy: 'Academy',
  User: 'User',
  Coach: 'Coach',
  Sport: 'Sport',
  DurationPlan: 'DurationPlan',
  Batch: 'Batch',
  BatchCoach: 'BatchCoach',
  Student: 'Student',
  StudentEnrollment: 'StudentEnrollment',
  Receipt: 'Receipt',
  StudentAttendance: 'StudentAttendance',
  CoachAttendance: 'CoachAttendance',
  PerformanceAttribute: 'PerformanceAttribute',
  PerformanceScore: 'PerformanceScore',
  Notification: 'Notification',
  AuditLog: 'AuditLog',
  PasswordReset: 'PasswordReset'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

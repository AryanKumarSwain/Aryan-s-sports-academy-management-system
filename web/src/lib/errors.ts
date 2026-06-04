export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SubscriptionLimitError extends ApiError {
  constructor(public entity: 'coach' | 'student') {
    super(`Upgrade your plan to add more ${entity}s`, 'PLAN_LIMIT_REACHED', 402);
  }
}

export class SubscriptionExpiredError extends ApiError {
  constructor() {
    super('Subscription has expired', 'SUBSCRIPTION_EXPIRED', 403);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409);
  }
}

export class GeofenceError extends ApiError {
  constructor() {
    super('You must be within academy radius to mark present', 'OUTSIDE_GEOFENCE', 422);
  }
}

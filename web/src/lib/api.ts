import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, SubscriptionLimitError } from './errors';

export type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export function ok<T>(data: T, meta?: ApiMeta, status = 200) {
  return NextResponse.json({ success: true, data, meta }, { status });
}

export function fail(error: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error, code }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    const body: { success: false; error: string; code: string; entity?: string } = {
      success: false,
      error: error.message,
      code: error.code
    };
    if (error instanceof SubscriptionLimitError) {
      body.entity = error.entity;
    }
    return NextResponse.json(body, { status: error.statusCode });
  }
  if (error instanceof ZodError) {
    const msg = error.issues.map((i) => i.message).join('; ');
    return fail(msg, 'VALIDATION_ERROR', 400);
  }
  const err = error as { statusCode?: number; message?: string };
  if (err.statusCode && err.message) {
    return fail(err.message, 'ERROR', err.statusCode);
  }
  console.error('[API]', error);
  return fail('Internal server error', 'INTERNAL_ERROR', 500);
}

/** @deprecated Use ok(data, meta) — kept for gradual migration */
export function okLegacy<T>(data: T, message = 'Success', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

/** @deprecated Use fail(error, code) */
export function failLegacy(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}
